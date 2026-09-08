import { michoacanParcels } from "../../data/michoacanParcels";

export function initAiChatbot(): void {
  const toggle = document.getElementById("btnToggleAiChat");
  const send = document.getElementById("btnSendAi");
  const input = document.getElementById("aiInput") as HTMLInputElement | null;
  if (!toggle || !input) return;

  function toggleChat() {
    document.getElementById("aiChatWindow")?.classList.toggle("hidden");
  }

  toggle.addEventListener("click", toggleChat);
  document.getElementById("btnCloseAiChat")?.addEventListener("click", toggleChat);
  send?.addEventListener("click", sendAiMessage);
  input.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Enter") sendAiMessage();
  });
}

function sendAiMessage(): void {
  const input = document.getElementById("aiInput") as HTMLInputElement | null;
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  const container = document.getElementById("aiMessages");
  if (!container) return;

  container.innerHTML += `
    <div class="flex justify-end">
      <div class="bg-primary text-on-primary p-2 rounded-xl rounded-tr-none text-label-sm font-label-sm max-w-[85%]">
        ${text}
      </div>
    </div>
  `;
  input.value = "";

  setTimeout(() => {
    let reply = "No comprendo la consulta. Prueba consultando por 'deforestación', 'subdivisión', o un ID como 'MCH-007'.";
    const q = text.toLowerCase();

    if (q.includes("deforest") || q.includes("alerta")) {
      const def = michoacanParcels.features.filter((f) => f.properties.historialDeforestacion?.length > 0);
      reply = `🚨 Se identifican ${def.length} predios con historial de deforestación: <strong>${def.map((f) => f.properties.id).join(", ")}</strong>. Ninguno es apto para exportar aguacate a la UE bajo reglamento EUDR.`;
    } else if (q.includes("subdivis") || q.includes("bloquea")) {
      const sub = michoacanParcels.features.filter((f) => f.properties.subdivisionBloqueada);
      reply = `🛑 Predios con intento de fraccionamiento fraudulento bloqueado: <strong>${sub.map((f) => f.properties.id).join(", ")}</strong>. La regla inmutable estipula que la historia del predio completo prevalece.`;
    } else if (q.includes("geometr") || q.includes("traslape") || q.includes("intersec")) {
      const geom = michoacanParcels.features.filter((f) => f.properties.geometryIssues?.length > 0);
      reply = `📐 Predios con errores cartográficos detectados por IA (Turf.js): <strong>${geom.map((f) => f.properties.id).join(", ")}</strong> (auto-intersecciones o solapes de linderos).`;
    } else {
      const match = q.match(/mch-\d{3}/i);
      if (match) {
        const id = match[0].toUpperCase();
        const found = michoacanParcels.features.find((f) => f.properties.id === id);
        if (found) {
          const p = found.properties;
          reply = `📍 <strong>${id}</strong> (${p.municipio}): Propietario <em>${p.propietario}</em>, ${p.superficieHa} ha. Estado: <strong>${p.exportacion.toUpperCase()}</strong>. ${p.historialDeforestacion.length > 0 ? "Tiene alertas de tala." : "Sin alertas de tala."}`;
        } else {
          reply = `No localicé el predio ${id} en la franja aguacatera.`;
        }
      }
    }

    container.innerHTML += `
      <div class="flex justify-start">
        <div class="bg-surface-container-lowest border border-outline-variant/40 text-on-surface p-2.5 rounded-xl rounded-tl-none text-label-sm font-label-sm max-w-[90%] shadow-sm">
          ${reply}
        </div>
      </div>
    `;
    container.scrollTop = container.scrollHeight;
  }, 400);
}
