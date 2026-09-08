import { initMap } from "./map-setup";
import { initTimeSlider } from "./time-slider";
import { initAiChatbot } from "./ai-chatbot";
import { initMapControls } from "./map-controls";
import { initParcelDrawer } from "./parcel-drawer";
import { teardownMap } from "./state";

let mapInitToken: symbol | null = null;
let mapInitInFlight = false;

export function initMapPage(): void {
  initMapControls();
  initParcelDrawer();
  initTimeSlider();
  initAiChatbot();

  if (mapInitInFlight) return;
  mapInitInFlight = true;

  const token = Symbol();
  mapInitToken = token;

  setTimeout(() => {
    if (mapInitToken !== token) return;
    mapInitInFlight = false;
    if (!document.getElementById("map")) return;
    void initMap();
  }, 500);
}

function cleanupMapPage(): void {
  mapInitToken = null;
  mapInitInFlight = false;
  teardownMap();
}

if (typeof document !== "undefined") {
  document.addEventListener("astro:page-load", initMapPage);
  document.addEventListener("astro:before-swap", cleanupMapPage);
}
