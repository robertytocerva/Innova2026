import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { state } from "./state";
import { michoacanParcels } from "../../data/michoacanParcels";
import { calculateVedaForestal, getParcelFireRecords } from "../../lib/nasaFirms";
import { validatePolygon } from "../../lib/geometryValidator";
import { getWaybackUrl, SATELLITE_HISTORY_END } from "../../lib/satelliteHistory";
import { openParcelDetail } from "./parcel-drawer";
import type { ParcelFeature } from "../../types/mapa";

interface ManagedLayer {
  remove: () => void;
}

function waitForStableSize(
  container: HTMLElement,
  timeoutMs = 4000,
): Promise<DOMRect> {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    let lastRect: { w: number; h: number } | null = null;
    let stableFrames = 0;
    const REQUIRED = 3;
    const MIN_SIZE = 200;

    const measure = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);

      if (w >= MIN_SIZE && h >= MIN_SIZE) {
        if (lastRect && lastRect.w === w && lastRect.h === h) {
          stableFrames++;
          if (stableFrames >= REQUIRED) {
            resolve(rect);
            return;
          }
        } else {
          stableFrames = 0;
          lastRect = { w, h };
        }
      } else {
        stableFrames = 0;
        lastRect = null;
      }

      if (performance.now() - start > timeoutMs) {
        if (w > 0 && h > 0) {
          resolve(rect);
          return;
        }
        reject(new Error("Map container never reached a usable size"));
        return;
      }
      requestAnimationFrame(measure);
    };

    measure();
  });
}

function invalidateSizeRepeatedly(): void {
  if (!state.map) return;
  state.map.invalidateSize();
  requestAnimationFrame(() => state.map?.invalidateSize());
  setTimeout(() => state.map?.invalidateSize(), 100);
  setTimeout(() => state.map?.invalidateSize(), 400);
  setTimeout(() => state.map?.invalidateSize(), 900);
  setTimeout(() => state.map?.invalidateSize(), 1500);
}

export async function initMap(): Promise<void> {
  const container = document.getElementById("map") as HTMLDivElement | null;
  if (!container) return;

  try {
    await waitForStableSize(container);
  } catch {
    return;
  }

  if (state.map) {
    try {
      state.map.remove();
    } catch {
      // ignore
    }
    state.map = null;
  }

  if (state.resizeObserver) {
    state.resizeObserver.disconnect();
    state.resizeObserver = null;
  }

  state.map = L.map("map", {
    zoomControl: true,
    fadeAnimation: false,
    zoomAnimation: false,
    preferCanvas: false,
  });

  let satelliteLayer: ManagedLayer = L.tileLayer(getWaybackUrl(SATELLITE_HISTORY_END), {
    maxZoom: 18,
    attribution: `Tiles &copy; Esri Wayback (${SATELLITE_HISTORY_END})`,
  }).addTo(state.map) as unknown as ManagedLayer;

  document.addEventListener("map:year-change", ((event: Event) => {
    const detail = (event as CustomEvent<{ year: number }>).detail;
    if (!detail || !state.map) return;
    satelliteLayer.remove();
    const newLayer = L.tileLayer(getWaybackUrl(detail.year), {
      maxZoom: 18,
      attribution: `Tiles &copy; Esri Wayback (${detail.year})`,
    }).addTo(state.map);
    satelliteLayer = newLayer as unknown as ManagedLayer;
  }) as EventListener);

  const parcelsLayer = L.geoJSON(michoacanParcels as unknown as GeoJSON.FeatureCollection, {
    style: (f) => getPolygonStyle(f as unknown as ParcelFeature),
    onEachFeature: (f, l) => onEachParcel(f as unknown as ParcelFeature, l),
  } as L.GeoJSONOptions).addTo(state.map);

  document.addEventListener("map:reset-styles", () => {
    parcelsLayer.resetStyle();
  });

  state.map.setView([19.42, -102.05], 10);
  state.map.fitBounds((parcelsLayer as L.GeoJSON).getBounds(), { padding: [40, 40] });

  invalidateSizeRepeatedly();

  state.resizeObserver = new ResizeObserver(() => {
    state.map?.invalidateSize();
  });
  state.resizeObserver.observe(container);
}

function getPolygonStyle(feature: ParcelFeature): L.PathOptions {
  const p = feature.properties;
  const fireRecords = getParcelFireRecords(feature);
  const vedaInfo = calculateVedaForestal(fireRecords);
  const geometryValidation = validatePolygon(feature, michoacanParcels);
  const hasGeometryIssues = Boolean(p.geometryIssues?.length || geometryValidation.issues.length);

  let fillColor = "#22c55e";
  let fillOpacity = 0.35;
  let color = "#15803d";
  let weight = 2;
  let dashArray: string | undefined;

  if (p.exportacion === "bloqueada" || p.deforestacionDetectada || vedaInfo.vedaActiva) {
    fillColor = "#ef4444";
    color = "#b91c1c";
    fillOpacity = 0.45;
  } else if (p.exportacion === "en_revision") {
    fillColor = "#f59e0b";
    color = "#d97706";
    fillOpacity = 0.4;
  }

  if (p.subdivisionBloqueada) {
    color = "#dc2626";
    dashArray = "6, 6";
    weight = 3;
  } else if (hasGeometryIssues) {
    color = "#ea580c";
    weight = 3;
  }

  return { fillColor, fillOpacity, color, weight, dashArray };
}

function onEachParcel(feature: ParcelFeature, layer: L.Layer): void {
  const l = layer as L.Path;
  const coords = feature.geometry?.coordinates?.[0] ?? [];
  const vertices = coords.length > 1 ? coords.slice(0, -1) : coords;

  const coordRows = vertices
    .map(
      (pt, i) => `
      <tr class="border-b border-slate-100 last:border-none">
        <td class="px-2 py-0.5 text-slate-400 font-mono">P${i + 1}</td>
        <td class="px-2 py-0.5 font-mono text-emerald-950 font-medium">${pt[1].toFixed(6)}°N</td>
        <td class="px-2 py-0.5 font-mono text-emerald-950 font-medium">${pt[0].toFixed(6)}°W</td>
      </tr>
    `
    )
    .join("");

  l.bindTooltip(
    `
    <div style="font-size:12px;min-width:270px;">
      <div style="margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-weight:700;color:#005d42;font-size:13px;font-family:monospace;">${feature.properties.id}</span>
        <span style="color:#475569;font-weight:600;">${feature.properties.municipio}</span>
      </div>
      <div style="color:#64748b;margin-bottom:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Vértices del polígono (WGS 84)</div>
      <table style="border-collapse:collapse;width:100%;font-size:11px;">
        <thead>
          <tr style="border-bottom:1px solid #cbd5e1;background:#f8fafc;">
            <th style="padding:2px 6px;text-align:left;color:#64748b;font-size:10px;">Pto</th>
            <th style="padding:2px 6px;text-align:left;color:#64748b;font-size:10px;">Latitud</th>
            <th style="padding:2px 6px;text-align:left;color:#64748b;font-size:10px;">Longitud</th>
          </tr>
        </thead>
        <tbody>${coordRows}</tbody>
      </table>
    </div>
  `,
    { sticky: true, className: "leaflet-tooltip-custom" }
  );

  l.on("click", () => openParcelDetail(feature));
}
