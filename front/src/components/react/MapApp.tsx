import { useState, useCallback, useRef, type ReactElement } from "react";
import type { Map as LeafletMap, Layer } from "leaflet";
import type { ParcelFeature } from "../../types/mapa";
import MapLeaflet from "./MapLeaflet";
import MapControls from "./MapControls";
import MapLegend from "./MapLegend";
import ParcelDrawer from "./ParcelDrawer";
import TimeSlider from "./TimeSlider";
import AiChatbot from "./AiChatbot";
import { SATELLITE_HISTORY_END, SATELLITE_HISTORY_START } from "../../lib/satelliteHistory";

export default function MapApp(): ReactElement {
  const [selectedFeature, setSelectedFeature] = useState<ParcelFeature | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [currentYear, setCurrentYear] = useState<number>(SATELLITE_HISTORY_END);
  const [comparisonYear, setComparisonYear] = useState<number>(SATELLITE_HISTORY_START);
  const [stylesVersion, setStylesVersion] = useState(0);

  const mapRef = useRef<LeafletMap | null>(null);
  const parcelsLayerRef = useRef<Layer | null>(null);

  const handleMapReady = useCallback((map: LeafletMap) => {
    mapRef.current = map;
  }, []);

  const handleParcelsLayer = useCallback((layer: Layer) => {
    parcelsLayerRef.current = layer;
  }, []);

  const handleSelectParcel = useCallback((feature: ParcelFeature) => {
    setSelectedFeature(feature);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleParcelBlocked = useCallback(() => {
    setStylesVersion((v) => v + 1);
  }, []);

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
          stylesVersion={stylesVersion}
        />

        <MapControls onToggleLegend={() => setShowLegend((v) => !v)} />

        {showLegend && <MapLegend onClose={() => setShowLegend(false)} />}

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
