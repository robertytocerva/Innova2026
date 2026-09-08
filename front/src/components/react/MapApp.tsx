import { useState, useCallback, useRef, type ReactElement } from "react";
import type { Map as LeafletMap, Layer, Path } from "leaflet";
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

  const handleResetStyles = useCallback(() => {
    const layer = parcelsLayerRef.current as (Path & { resetStyle?: () => void }) | null;
    if (layer?.resetStyle) layer.resetStyle();
  }, []);

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden flex flex-col bg-inverse-surface text-surface">
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <MapLeaflet
          currentYear={currentYear}
          onMapReady={handleMapReady}
          onParcelsLayer={handleParcelsLayer}
          onSelectParcel={handleSelectParcel}
          selectedFeature={selectedFeature}
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
          onParcelBlocked={handleResetStyles}
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
