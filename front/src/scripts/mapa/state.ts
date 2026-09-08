import type L from "leaflet";
import type { ParcelFeature } from "../../types/mapa";
import { getParcelTimeSeriesUrls, SATELLITE_HISTORY_END, SATELLITE_HISTORY_START } from "../../lib/satelliteHistory";

export interface MapPageState {
  selectedFeature: ParcelFeature | null;
  map: L.Map | null;
  currentMapYear: number;
  comparisonStartYear: number;
  activeTimeSeries: ReturnType<typeof getParcelTimeSeriesUrls> | null;
  resizeObserver: ResizeObserver | null;
}

export const state: MapPageState = {
  selectedFeature: null,
  map: null,
  currentMapYear: SATELLITE_HISTORY_END,
  comparisonStartYear: SATELLITE_HISTORY_START,
  activeTimeSeries: null,
  resizeObserver: null,
};

export function teardownMap(): void {
  if (state.resizeObserver) {
    state.resizeObserver.disconnect();
    state.resizeObserver = null;
  }
  if (state.map) {
    try {
      state.map.remove();
    } catch {
      // Map may already be detached from a removed DOM element.
    }
    state.map = null;
  }
  state.selectedFeature = null;
  state.activeTimeSeries = null;
}
