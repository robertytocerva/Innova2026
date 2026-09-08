import { useEffect, useMemo, useRef, useCallback, type ReactElement } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { michoacanParcels } from "../../data/michoacanParcels";
import { getWaybackUrl } from "../../lib/satelliteHistory";
import { getParcelFireRecords, calculateVedaForestal } from "../../lib/nasaFirms";
import { validatePolygon } from "../../lib/geometryValidator";
import type { ParcelFeature } from "../../types/mapa";
import type { Map as LeafletMap, Layer } from "leaflet";

interface Props {
  currentYear: number;
  selectedFeature: ParcelFeature | null;
  stylesVersion: number;
  onMapReady: (map: LeafletMap) => void;
  onParcelsLayer: (layer: Layer) => void;
  onSelectParcel: (feature: ParcelFeature) => void;
}

type MapStyle = L.PathOptions;

function getStyleForFeature(feature: ParcelFeature): MapStyle {
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

function buildTooltip(feature: ParcelFeature): string {
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
      `,
    )
    .join("");

  return `
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
  `;
}

const TOOLTIP_CACHE = new Map<string, string>(
  michoacanParcels.features.map((f) => [f.properties.id, buildTooltip(f as unknown as ParcelFeature)]),
);

function computeInitialBounds(): L.LatLngBoundsExpression {
  const bounds = L.latLngBounds([]);
  for (const feature of michoacanParcels.features) {
    const ring = feature.geometry.coordinates[0];
    for (const point of ring) {
      bounds.extend([point[1], point[0]]);
    }
  }
  return bounds;
}

const INITIAL_BOUNDS = computeInitialBounds();

function MapEvents({ onMapReady }: { onMapReady: (map: LeafletMap) => void }): null {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
    const handle = window.setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(INITIAL_BOUNDS, { padding: [40, 40], animate: false });
    }, 200);
    return () => window.clearTimeout(handle);
  }, [map, onMapReady]);
  return null;
}

export default function MapLeaflet({ currentYear, stylesVersion, onMapReady, onParcelsLayer, onSelectParcel }: Props): ReactElement {
  const parcelsLayerRef = useRef<L.GeoJSON | null>(null);
  const tileUrl = useMemo(() => getWaybackUrl(currentYear), [currentYear]);

  const styles = useMemo<Map<string, MapStyle>>(() => {
    const next = new Map<string, MapStyle>();
    for (const feature of michoacanParcels.features) {
      const parcel = feature as unknown as ParcelFeature;
      next.set(parcel.properties.id, getStyleForFeature(parcel));
    }
    return next;
  }, [stylesVersion]);

  const styleFn = useCallback(
    (feature?: GeoJSON.Feature): MapStyle => {
      if (!feature) return {};
      const id = (feature.properties as { id?: string } | null)?.id;
      return id ? styles.get(id) ?? {} : {};
    },
    [styles],
  );

  const onEachFeature = useCallback(
    (feature: GeoJSON.Feature, layer: L.Layer): void => {
      const parcel = feature as unknown as ParcelFeature;
      const html = TOOLTIP_CACHE.get(parcel.properties.id);
      if (html) {
        (layer as L.Path).bindTooltip(html, { sticky: true, className: "leaflet-tooltip-custom" });
      }
      (layer as L.Path).on("click", () => onSelectParcel(parcel));
    },
    [onSelectParcel],
  );

  const handleLayerRef = useCallback(
    (layer: L.GeoJSON | null): void => {
      parcelsLayerRef.current = layer;
      if (layer) onParcelsLayer(layer);
    },
    [onParcelsLayer],
  );

  return (
    <MapContainer
      center={[19.42, -102.05]}
      zoom={10}
      zoomControl={true}
      fadeAnimation={false}
      zoomAnimation={false}
      style={{ height: "100%", width: "100%", background: "var(--color-inverse-surface)" }}
    >
      <MapEvents onMapReady={onMapReady} />
      <TileLayer key={currentYear} url={tileUrl} maxZoom={18} attribution="Tiles &copy; Esri Wayback" />
      <GeoJSON
        ref={handleLayerRef}
        data={michoacanParcels as unknown as GeoJSON.FeatureCollection}
        style={styleFn}
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  );
}
