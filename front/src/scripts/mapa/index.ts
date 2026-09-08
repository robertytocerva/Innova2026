import { initMap } from "./map-setup";
import { initTimeSlider } from "./time-slider";
import { initAiChatbot } from "./ai-chatbot";
import { initMapControls } from "./map-controls";
import { initParcelDrawer } from "./parcel-drawer";

export function initMapPage(): void {
  initMapControls();
  initParcelDrawer();
  initTimeSlider();
  initAiChatbot();
  initMap();
}

if (typeof document !== "undefined") {
  document.addEventListener("astro:page-load", initMapPage);
}
