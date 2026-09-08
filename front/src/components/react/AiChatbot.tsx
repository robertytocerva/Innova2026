import { useState, useRef, useEffect, type ReactElement } from "react";
import { michoacanParcels } from "../../data/michoacanParcels";

interface Props {
  open: boolean;
  onToggle: () => void;
}

export default function AiChatbot({ open, onToggle }: Props): ReactElement {
  const [messages, setMessages] = useState<Array<{ role: "user" | "bot"; text: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (): void => {
    const text = inputRef.current?.value.trim() ?? "";
    if (!text) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    if (inputRef.current) inputRef.current.value = "";

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

      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    }, 400);
  };

  return (
    <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end md:bottom-6 md:right-6">
      {open && (
        <div className="w-80 h-96 mb-3 bg-surface-container-lowest text-on-surface rounded-2xl shadow-2xl border border-outline-variant/40 flex flex-col overflow-hidden">
          <div className="p-3 bg-primary-container text-surface flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-fixed text-[20px]">smart_toy</span>
              <div>
                <div className="font-bold text-label-sm font-label-sm">Asistente IA Forestal</div>
                <div className="text-[10px] text-on-primary">Consultas satelitales Michoacán</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="text-on-primary hover:text-surface"
              aria-label="Cerrar chat"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <div ref={containerRef} className="flex-1 overflow-y-auto p-3 space-y-2 text-label-sm font-label-sm bg-surface-container-low">
            <div className="bg-primary-container/30 text-on-surface p-2.5 rounded-xl rounded-tl-none border border-primary-fixed/40 text-label-sm font-label-sm">
              👋 Hola. Puedo responderte sobre:
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] text-on-surface">
                <li>Historial de predios (ej: <strong>MCH-007</strong>)</li>
                <li>Parcelas con <strong>deforestación</strong></li>
                <li>Intentos de <strong>subdivisión</strong> bloqueados</li>
                <li>Errores de <strong>geometría</strong> detectados</li>
              </ul>
              <p className="mt-2 pt-1.5 border-t border-primary-fixed/30 text-[9px] text-on-surface/50 leading-relaxed">
                Demo rule-based · Gemini 1.5 Flash integrado para redacción de dictámenes en producción
              </p>
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={
                    m.role === "user"
                      ? "bg-primary text-on-primary p-2 rounded-xl rounded-tr-none text-label-sm font-label-sm max-w-[85%]"
                      : "bg-surface-container-lowest border border-outline-variant/40 text-on-surface p-2.5 rounded-xl rounded-tl-none text-label-sm font-label-sm max-w-[90%] shadow-sm"
                  }
                  dangerouslySetInnerHTML={{ __html: m.text }}
                />
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-outline-variant/40 bg-surface-container-lowest flex gap-1.5">
            <input
              ref={inputRef}
              type="text"
              placeholder="Escribe tu consulta..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-1.5 text-label-sm font-label-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={sendMessage}
              className="p-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg flex items-center justify-center"
              aria-label="Enviar"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onToggle}
        className="w-13 h-13 p-3.5 bg-primary hover:bg-primary-container text-on-primary rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 border-2 border-surface"
        aria-label="Abrir asistente IA"
      >
        <span className="material-symbols-outlined text-[22px]">smart_toy</span>
      </button>
    </div>
  );
}
