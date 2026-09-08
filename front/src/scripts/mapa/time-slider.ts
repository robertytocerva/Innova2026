import { state } from "./state";
import { updateDrawerComparison } from "./parcel-drawer";
import { getWaybackUrl, SATELLITE_HISTORY_END, SATELLITE_HISTORY_START } from "../../lib/satelliteHistory";

export function initTimeSlider(): void {
  const startYearSelect = document.getElementById("mapStartYear") as HTMLSelectElement | null;
  const yearSlider = document.getElementById("mapYearSlider") as HTMLInputElement | null;
  if (!startYearSelect || !yearSlider) return;

  const yearBadge = document.getElementById("mapCurrentYearBadge");
  const endYearLabel = document.getElementById("mapEndYearLabel");
  const timelineNotice = document.getElementById("mapTimelineNotice");

  function updateNotice() {
    if (timelineNotice) {
      timelineNotice.textContent = `Comparativa activa: ${state.comparisonStartYear} vs ${state.currentMapYear} + incendios NASA FIRMS 2012–${new Date().getFullYear()}.`;
    }
    updateDrawerComparison();
  }

  yearSlider?.addEventListener("input", () => {
    const year = Number(yearSlider.value);
    state.currentMapYear = year;
    const availableYear = Math.min(SATELLITE_HISTORY_END, Math.max(SATELLITE_HISTORY_START, year));
    if (yearBadge) yearBadge.textContent = String(year);
    if (endYearLabel) endYearLabel.textContent = String(year);

    const event = new CustomEvent("map:year-change", { detail: { year: availableYear } });
    document.dispatchEvent(event);

    updateNotice();
  });

  startYearSelect?.addEventListener("change", () => {
    state.comparisonStartYear = Number(startYearSelect.value);
    if (state.comparisonStartYear > state.currentMapYear) {
      state.comparisonStartYear = state.currentMapYear;
      startYearSelect.value = String(state.comparisonStartYear);
    }
    updateNotice();
  });

  updateNotice();
}

export function updateSatelliteMapLayer(year: number, satelliteLayer: { remove: () => void; layer: unknown }): { remove: () => void; layer: unknown } {
  satelliteLayer.remove();
  const availableYear = Math.min(SATELLITE_HISTORY_END, Math.max(SATELLITE_HISTORY_START, year));
  const newLayer = window.L.tileLayer(getWaybackUrl(availableYear), {
    maxZoom: 18,
    attribution: `Tiles &copy; Esri Wayback (${availableYear})`,
  });
  if (state.map) newLayer.addTo(state.map);
  return { remove: () => newLayer.remove(), layer: newLayer };
}
