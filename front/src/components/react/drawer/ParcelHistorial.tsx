import type { ReactElement } from "react";
import type { ParcelFeature } from "../../../types/mapa";
import { SectionIcon } from "./DrawerPrimitives";

interface Props {
  feature: ParcelFeature;
}

export default function ParcelHistorial({ feature }: Props): ReactElement {
  const events = feature.properties.historialDeforestacion ?? [];
  const hasEvents = events.length > 0;

  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2">
        <SectionIcon name="history_toggle_off" gradient="from-error/40 to-error/10" />
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface">Historial Satelital</h3>
      </div>

      {hasEvents ? (
        <div className="space-y-2">
          {events.map((ev, i) => (
            <div
              key={i}
              className="group p-3 rounded-xl bg-gradient-to-br from-error-container/30 to-error/5 border border-error/30 text-error transition-all hover:shadow-md hover:border-error/50"
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">⚠️ {ev.tipo}</span>
                <span className="font-mono text-[10px] text-error/70">{ev.fecha}</span>
              </div>
              <div className="text-[11px] mt-1.5 text-error/90">
                Área talada: <strong>{ev.areaHa} ha</strong> · Sensor: <strong>{ev.fuente}</strong>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-tertiary/10 border border-primary/30 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary">
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </span>
          <span className="text-on-surface">Sin eventos de deforestación desde 2018.</span>
        </div>
      )}
    </section>
  );
}
