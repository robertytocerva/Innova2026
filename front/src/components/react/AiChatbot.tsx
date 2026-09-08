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
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {open && (
        <div className="w-80 h-96 bg-gradient-to-b from-surface-container-lowest to-surface-container-low rounded-2xl shadow-2xl border border-outline-variant/40 flex flex-col overflow-hidden ring-1 ring-primary/10">
          <div className="relative p-3.5 bg-gradient-to-r from-primary-container via-inverse-surface to-primary-container text-surface">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,212,90,0.2),transparent_50%)] pointer-events-none"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-tertiary to-secondary-fixed text-on-secondary-fixed shadow-md">
                  <span className="absolute inline-flex h-full w-full rounded-xl bg-tertiary/40 animate-ping opacity-30"></span>
                  <span className="material-symbols-outlined text-[20px] relative">smart_toy</span>
                </div>
                <div>
                  <div className="font-bold text-[12px]">Asistente IA Forestal</div>
                  <div className="text-[10px] text-on-primary/80">Consultas satelitales Michoacán</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggle}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-on-primary/70 hover:text-surface hover:bg-surface/15 transition-colors"
                aria-label="Cerrar chat"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>

          <div ref={containerRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 text-[11px] bg-gradient-to-b from-surface-container-low/50 to-surface-container-low/30">
            <div className="bg-gradient-to-br from-primary-container/30 to-tertiary/10 text-on-surface p-3 rounded-2xl rounded-tl-md border border-primary-fixed/40 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-primary mb-1.5">
                <span className="material-symbols-outlined text-[14px]">waving_hand</span>
                Hola, soy el asistente
              </div>
              <p className="text-[11px] text-on-surface/90 mb-1.5">Puedo responderte sobre:</p>
              <ul className="space-y-0.5 text-[10px] text-on-surface/80 list-none">
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-primary"></span> Historial de predios (MCH-007)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-error"></span> Parcelas con deforestación
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-amber-500"></span> Intentos de subdivisión bloqueados
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-orange-500"></span> Errores de geometría detectados
                </li>
              </ul>
              <p className="mt-2 pt-1.5 border-t border-primary-fixed/20 text-[9px] text-on-surface/50 leading-relaxed">
                Demo rule-based · Gemini 1.5 Flash integrado para dictámenes
              </p>
            </div>

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] p-2.5 rounded-2xl rounded-tr-md bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-sm text-[11px]"
                      : "max-w-[90%] p-2.5 rounded-2xl rounded-tl-md bg-gradient-to-br from-surface-container-lowest to-surface-container border border-outline-variant/40 text-on-surface shadow-sm text-[11px]"
                  }
                  dangerouslySetInnerHTML={{ __html: m.text }}
                />
              </div>
            ))}
          </div>

          <div className="p-2.5 border-t border-outline-variant/30 bg-gradient-to-b from-surface-container-lowest to-surface-container-low flex gap-1.5">
            <input
              ref={inputRef}
              type="text"
              placeholder="Escribe tu consulta..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 bg-gradient-to-br from-surface-container to-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2 text-[11px] text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              type="button"
              onClick={sendMessage}
              className="group flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-sm hover:shadow-md hover:scale-105 transition-all"
              aria-label="Enviar"
            >
              <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">send</span>
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onToggle}
        className="group relative h-14 w-14 rounded-full bg-gradient-to-br from-primary via-primary-container to-inverse-surface text-on-primary shadow-xl hover:shadow-[0_0_30px_rgba(200,212,90,0.4)] hover:scale-110 transition-all duration-200 border-2 border-surface ring-2 ring-primary/20"
        aria-label="Abrir asistente IA"
      >
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-tertiary to-primary opacity-0 group-hover:opacity-30 blur transition-opacity"></span>
        <span className="relative flex items-center justify-center h-full w-full">
          <span className="material-symbols-outlined text-[24px]">smart_toy</span>
        </span>
      </button>
    </div>
  );
}
