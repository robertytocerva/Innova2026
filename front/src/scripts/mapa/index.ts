import { initMap } from "./map-setup";
import { initTimeSlider } from "./time-slider";
import { initAiChatbot } from "./ai-chatbot";
import { initMapControls } from "./map-controls";
import { initParcelDrawer } from "./parcel-drawer";
import { teardownMap } from "./state";

export function initMapPage(): void {
  initMapControls();
  initParcelDrawer();
  initTimeSlider();
  initAiChatbot();
  void initMap();
}

function cleanupMapPage(): void {
  teardownMap();
}

if (typeof document !== "undefined") {
  document.addEventListener("astro:page-load", initMapPage);
  document.addEventListener("astro:before-swap", cleanupMapPage);
}
