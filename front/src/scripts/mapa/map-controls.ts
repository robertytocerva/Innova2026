export function initMapControls(): void {
  const toggle = document.getElementById("btnToggleLegend");
  const close = document.getElementById("btnCloseLegend");
  const panel = document.getElementById("legendPanel");
  if (!toggle || !panel) return;

  toggle.addEventListener("click", () => panel.classList.toggle("hidden"));
  close?.addEventListener("click", () => panel.classList.add("hidden"));
}
