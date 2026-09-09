<<<<<<< HEAD
import { useEffect, useMemo, useRef, useCallback, type ReactElement } from "react";
=======
import { useEffect, useMemo, useRef, type ReactElement } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from "react-leaflet";
>>>>>>> 79d7fc8 (creacion de polingonos manuales para el mapa)
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { michoacanParcels } from "../../data/michoacanParcels";
import { getWaybackUrl } from "../../lib/satelliteHistory";
import { getParcelFireRecords, calculateVedaForestal } from "../../lib/nasaFirms";
import { validatePolygon } from "../../lib/geometryValidator";
import type { ParcelFeature, ParcelFeatureCollection, DrawingPoint, DrawingState } from "../../types/mapa";
import type { Map as LeafletMap, Layer } from "leaflet";

interface Props {
  currentYear: number;
  selectedFeature: ParcelFeature | null;
<<<<<<< HEAD
  stylesVersion: number;
=======
  drawingState: DrawingState;
  parcels: ParcelFeatureCollection;
>>>>>>> 79d7fc8 (creacion de polingonos manuales para el mapa)
  onMapReady: (map: LeafletMap) => void;
  onParcelsLayer: (layer: Layer) => void;
  onSelectParcel: (feature: ParcelFeature) => void;
  onMapClick: (point: DrawingPoint) => void;
}

type MapStyle = L.PathOptions;

<<<<<<< HEAD
function getStyleForFeature(feature: ParcelFeature): MapStyle {
=======
function DrawingHandler({ drawingState, onMapClick }: { drawingState: DrawingState; onMapClick: (p: DrawingPoint) => void }): null {
  const statusRef = useRef(drawingState.status);
  const onMapClickRef = useRef(onMapClick);

  useEffect(() => {
    statusRef.current = drawingState.status;
  }, [drawingState.status]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useMapEvents({
    click(e) {
      if (statusRef.current !== "drawing") return;
      onMapClickRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return null;
}

function createMarkerIcon(index: number): L.DivIcon {
  return L.divIcon({
    className: "drawing-marker",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:#2563eb;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;font-weight:700;">${index + 1}</div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function DrawingLayer({ drawingState }: { drawingState: DrawingState }): null {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);
  const linesRef = useRef<L.Polyline[]>([]);
  const previewRef = useRef<L.Polygon | null>(null);
  const prevLenRef = useRef(0);
  const prevStatusRef = useRef<DrawingState["status"]>("idle");

  useEffect(() => {
    const { points, status } = drawingState;
    const prevLen = prevLenRef.current;
    const prevStatus = prevStatusRef.current;
    const statusChanged = status !== prevStatus;

    if (status === "idle" && prevStatus !== "idle") {
      markersRef.current.forEach((m) => map.removeLayer(m));
      linesRef.current.forEach((l) => map.removeLayer(l));
      if (previewRef.current) { map.removeLayer(previewRef.current); previewRef.current = null; }
      markersRef.current = [];
      linesRef.current = [];
      prevLenRef.current = 0;
      prevStatusRef.current = "idle";
      return;
    }

    if (statusChanged && prevStatus === "idle") {
      markersRef.current = [];
      linesRef.current = [];
      prevLenRef.current = 0;
    }

    if (points.length > prevLen && !statusChanged) {
      const newPt = points[points.length - 1];
      const marker = L.marker([newPt.lat, newPt.lng], { icon: createMarkerIcon(points.length - 1), interactive: false }).addTo(map);
      markersRef.current.push(marker);
      if (points.length >= 2) {
        const prev = points[points.length - 2];
        const line = L.polyline([[prev.lat, prev.lng], [newPt.lat, newPt.lng]], { color: "#2563eb", weight: 2.5, dashArray: "6, 4", interactive: false }).addTo(map);
        linesRef.current.push(line);
      }
    } else if (points.length < prevLen && !statusChanged) {
      const rm = markersRef.current.pop();
      if (rm) map.removeLayer(rm);
      if (linesRef.current.length > 0) {
        const rl = linesRef.current.pop();
        if (rl) map.removeLayer(rl);
      }
    } else if (statusChanged || (points.length >= prevLen && status === "drawing")) {
      markersRef.current.forEach((m) => map.removeLayer(m));
      linesRef.current.forEach((l) => map.removeLayer(l));
      markersRef.current = [];
      linesRef.current = [];
      points.forEach((pt, i) => {
        markersRef.current.push(L.marker([pt.lat, pt.lng], { icon: createMarkerIcon(i), interactive: false }).addTo(map));
      });
      if (points.length >= 2) {
        linesRef.current.push(L.polyline(points.map((p) => [p.lat, p.lng]), { color: "#2563eb", weight: 2.5, dashArray: "6, 4", interactive: false }).addTo(map));
      }
    }

    if (status === "preview" && points.length >= 3) {
      if (previewRef.current) map.removeLayer(previewRef.current);
      const closed = [...points, points[0]];
      previewRef.current = L.polygon(closed.map((p) => [p.lat, p.lng]), { color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.25, weight: 3, dashArray: "8, 6", interactive: false }).addTo(map);
    } else if (status !== "preview" && previewRef.current) {
      map.removeLayer(previewRef.current);
      previewRef.current = null;
    }

    prevLenRef.current = points.length;
    prevStatusRef.current = status;
  }, [drawingState, map]);

  return null;
}

function getPolygonStyle(feature: ParcelFeature): L.PathOptions {
>>>>>>> 79d7fc8 (creacion de polingonos manuales para el mapa)
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

<<<<<<< HEAD
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
=======
export default function MapLeaflet({ currentYear, onMapReady, onParcelsLayer, onSelectParcel, drawingState, onMapClick, parcels }: Props): ReactElement {
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const tileUrl = useMemo(() => getWaybackUrl(currentYear), [currentYear]);

  const handleEachFeature = (feature: GeoJSON.Feature, layer: L.Layer): void => {
    const path = layer as L.Path;
    const parcelFeature = feature as unknown as ParcelFeature;
    path.bindTooltip(buildTooltip(parcelFeature), { sticky: true, className: "leaflet-tooltip-custom" });
    path.on("click", (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e.originalEvent);
      onSelectParcel(parcelFeature);
    });
  };
>>>>>>> 79d7fc8 (creacion de polingonos manuales para el mapa)

  const drawingActive = drawingState.status === "drawing";

  return (
    <MapContainer
      center={[19.42, -102.05]}
      zoom={10}
      zoomControl={true}
      fadeAnimation={false}
      zoomAnimation={false}
      style={{ height: "100%", width: "100%", background: "var(--color-inverse-surface)" }}
      className={drawingActive ? "cursor-crosshair" : ""}
    >
      <MapEvents onMapReady={onMapReady} />
      <DrawingHandler drawingState={drawingState} onMapClick={onMapClick} />
      <DrawingLayer drawingState={drawingState} />
      <TileLayer key={currentYear} url={tileUrl} maxZoom={18} attribution="Tiles &copy; Esri Wayback" />
      <GeoJSON
<<<<<<< HEAD
        ref={handleLayerRef}
        data={michoacanParcels as unknown as GeoJSON.FeatureCollection}
        style={styleFn}
        onEachFeature={onEachFeature}
=======
        key={parcels.features.length}
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
        data={parcels as unknown as GeoJSON.FeatureCollection}
        style={(feature) => getPolygonStyle(feature as unknown as ParcelFeature)}
        onEachFeature={handleEachFeature}
>>>>>>> 79d7fc8 (creacion de polingonos manuales para el mapa)
      />
    </MapContainer>
  );
}
