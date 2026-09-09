import { useState, useCallback, useRef, useEffect, type ReactElement } from "react";
import type { Map as LeafletMap, Layer } from "leaflet";
import type { ParcelFeature, ParcelFeatureCollection, DrawingPoint, DrawingState } from "../../types/mapa";
import { michoacanParcels } from "../../data/michoacanParcels";
import { fetchParcels, type ApiParcel } from "../../lib/apiClient";
import MapLeaflet from "./MapLeaflet";
import MapControls from "./MapControls";
import MapLegend from "./MapLegend";
import ParcelDrawer from "./ParcelDrawer";
import PolygonDrawer from "./PolygonDrawer";
import TimeSlider from "./TimeSlider";
import AiChatbot from "./AiChatbot";
import { SATELLITE_HISTORY_END, SATELLITE_HISTORY_START } from "../../lib/satelliteHistory";

function apiParcelToFeature(p: ApiParcel): ParcelFeature | null {
  try {
    const raw: any = p as any;
    const geom = raw.geojson || (typeof raw.geometry === "string" ? JSON.parse(raw.geometry) : raw.geometry);
    if (!geom || geom.type !== "Polygon" || !geom.coordinates) return null;

    const meta = (raw.metadata || {}) as Record<string, any>;

    return {
      type: "Feature",
      id: p.id,
      geometry: {
        type: "Polygon",
        coordinates: geom.coordinates,
      },
      properties: {
        id: p.id,
        propietario: meta.propietario || p.name || "Sin propietario",
        municipio: p.municipality || "Sin municipio",
        superficieHa: p.area_ha || meta.superficieHa || 0,
        cultivo: p.crop_type || "other",
        fechaAlta: p.created_at?.slice(0, 10) || "",
        exportacion: "en_revision",
        deforestacionDetectada: false,
        historialDeforestacion: [],
        geometryIssues: [],
        subdivisionBloqueada: false,
        parentId: null,
        ndviPromedio: meta.ndviPromedio || 0,
        ultimaRevision: p.updated_at?.slice(0, 10) || "",
        confianzaIA: meta.confianzaIA || 0,
      },
    };
  } catch {
    return null;
  }
}

function mergeParcels(staticParcels: ParcelFeatureCollection, apiFeatures: ParcelFeature[]): ParcelFeatureCollection {
  const apiIds = new Set(apiFeatures.map((f) => f.id));
  const staticOnly = staticParcels.features.filter((f) => !apiIds.has(f.id as string));
  return {
    type: "FeatureCollection",
    features: [...apiFeatures, ...staticOnly],
  };
}

export default function MapApp(): ReactElement {
  const [selectedFeature, setSelectedFeature] = useState<ParcelFeature | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [currentYear, setCurrentYear] = useState<number>(SATELLITE_HISTORY_END);
  const [comparisonYear, setComparisonYear] = useState<number>(SATELLITE_HISTORY_START);
  const [drawingState, setDrawingState] = useState<DrawingState>({ status: "idle", points: [] });
  const [allParcels, setAllParcels] = useState<ParcelFeatureCollection>(michoacanParcels);
  const [stylesVersion, setStylesVersion] = useState(0);

  const mapRef = useRef<LeafletMap | null>(null);
  const parcelsLayerRef = useRef<Layer | null>(null);

  const loadParcels = useCallback(async () => {
    try {
      const { data } = await fetchParcels(100, 0);
      const apiFeatures = data.map(apiParcelToFeature).filter((f): f is ParcelFeature => f !== null);
      setAllParcels(mergeParcels(michoacanParcels, apiFeatures));
    } catch {
      setAllParcels(michoacanParcels);
    }
  }, []);

  useEffect(() => {
    loadParcels();
  }, [loadParcels]);

  const handleMapReady = useCallback((map: LeafletMap) => {
    mapRef.current = map;
  }, []);

  const handleParcelsLayer = useCallback((layer: Layer) => {
    parcelsLayerRef.current = layer;
  }, []);

  const handleSelectParcel = useCallback((feature: ParcelFeature) => {
    if (drawingState.status !== "idle") return;
    setSelectedFeature(feature);
    setDrawerOpen(true);
  }, [drawingState.status]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleParcelBlocked = useCallback(() => {
    setStylesVersion((v) => v + 1);
  }, []);

  const handleToggleDrawing = useCallback(() => {
    if (drawingState.status === "idle") {
      setDrawerOpen(false);
      setSelectedFeature(null);
      setDrawingState({ status: "drawing", points: [] });
    } else {
      setDrawingState({ status: "idle", points: [] });
    }
  }, [drawingState.status]);

  const handleMapClick = useCallback(
    (point: DrawingPoint) => {
      if (drawingState.status !== "drawing") return;
      setDrawingState((prev) => ({
        ...prev,
        points: [...prev.points, point],
      }));
    },
    [drawingState.status],
  );

  const handleRemoveLastPoint = useCallback(() => {
    setDrawingState((prev) => ({
      ...prev,
      points: prev.points.slice(0, -1),
    }));
  }, []);

  const handleClearPoints = useCallback(() => {
    setDrawingState((prev) => ({ ...prev, points: [] }));
  }, []);

  const handleClosePolygon = useCallback(() => {
    setDrawingState((prev) => ({
      ...prev,
      status: "preview",
    }));
  }, []);

  const handleParcelCreated = useCallback(() => {
    loadParcels();
    if (mapRef.current) {
      mapRef.current.setView([19.42, -102.05], 10);
    }
  }, [loadParcels]);

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden flex flex-col bg-gradient-to-br from-inverse-surface via-primary-container/40 to-inverse-surface text-surface">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(200,212,90,0.18), transparent 50%), radial-gradient(circle at 80% 80%, rgba(60,107,73,0.22), transparent 55%)",
        }}
      />
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <MapLeaflet
          currentYear={currentYear}
          onMapReady={handleMapReady}
          onParcelsLayer={handleParcelsLayer}
          onSelectParcel={handleSelectParcel}
          selectedFeature={selectedFeature}
          drawingState={drawingState}
          onMapClick={handleMapClick}
          parcels={allParcels}
          stylesVersion={stylesVersion}
        />

        <MapControls
          onToggleLegend={() => setShowLegend((v) => !v)}
          drawingStatus={drawingState.status}
          onToggleDrawing={handleToggleDrawing}
        />

        {showLegend && <MapLegend onClose={() => setShowLegend(false)} />}

        <PolygonDrawer
          drawingState={drawingState}
          onDrawingStateChange={setDrawingState}
          onAddPoint={handleMapClick}
          onRemoveLastPoint={handleRemoveLastPoint}
          onClearPoints={handleClearPoints}
          onClosePolygon={handleClosePolygon}
          onParcelCreated={handleParcelCreated}
        />

        <ParcelDrawer
          feature={selectedFeature}
          open={drawerOpen}
          onClose={handleCloseDrawer}
          onSelectParcel={handleSelectParcel}
          currentYear={currentYear}
          comparisonYear={comparisonYear}
          onParcelBlocked={handleParcelBlocked}
        />

        <TimeSlider
          currentYear={currentYear}
          comparisonYear={comparisonYear}
          onCurrentYearChange={setCurrentYear}
          onComparisonYearChange={setComparisonYear}
        />

        <AiChatbot open={showAiChat} onToggle={() => setShowAiChat((v) => !v)} />
      </div>
    </div>
  );
}
