import { useEffect, useMemo, useRef, type ReactElement } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { michoacanParcels } from "../../data/michoacanParcels";
import { getWaybackUrl } from "../../lib/satelliteHistory";
import { getParcelFireRecords, calculateVedaForestal } from "../../lib/nasaFirms";
import { validatePolygon } from "../../lib/geometryValidator";
import type { ParcelFeature } from "../../types/mapa";
import type { Map as LeafletMap, Layer } from "leaflet";

interface Props {
  currentYear: number;
  selectedFeature: ParcelFeature | null;
  onMapReady: (map: LeafletMap) => void;
  onParcelsLayer: (layer: Layer) => void;
  onSelectParcel: (feature: ParcelFeature) => void;
}

function MapEvents({ onMapReady }: { onMapReady: (map: LeafletMap) => void }): null {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
    const handle = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(handle);
  }, [map, onMapReady]);
  return null;
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

export default function MapLeaflet({ currentYear, onMapReady, onParcelsLayer, onSelectParcel }: Props): ReactElement {
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const tileUrl = useMemo(() => getWaybackUrl(currentYear), [currentYear]);

  const handleEachFeature = (feature: GeoJSON.Feature, layer: L.Layer): void => {
    const path = layer as L.Path;
    const parcelFeature = feature as unknown as ParcelFeature;
    path.bindTooltip(buildTooltip(parcelFeature), { sticky: true, className: "leaflet-tooltip-custom" });
    path.on("click", () => onSelectParcel(parcelFeature));
  };

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
        ref={(layer) => {
          if (layer) {
            geoJsonRef.current = layer;
            onParcelsLayer(layer);
            setTimeout(() => {
              try {
                layer.getBounds && layer.getBounds().isValid() && layer.getBounds();
              } catch {
                // ignore
              }
            }, 200);
          }
        }}
        data={michoacanParcels as unknown as GeoJSON.FeatureCollection}
        style={(feature) => getPolygonStyle(feature as unknown as ParcelFeature)}
        onEachFeature={handleEachFeature}
      />
    </MapContainer>
  );
}
