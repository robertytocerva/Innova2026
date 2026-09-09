import { useMemo, type ReactElement } from "react";
import type { ParcelFeature } from "../../../types/mapa";
import { calculateVedaForestal, getParcelFireRecords } from "../../../lib/nasaFirms";
import { SectionIcon } from "./DrawerPrimitives";

interface Props {
  feature: ParcelFeature;
}

export default function ParcelFirms({ feature }: Props): ReactElement {
  const fireRecords = useMemo(() => getParcelFireRecords(feature), [feature]);
  const vedaInfo = useMemo(() => calculateVedaForestal(fireRecords), [fireRecords]);

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SectionIcon name="local_fire_department" gradient="from-orange-600/40 to-orange-500/10" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface">NASA FIRMS</h3>
        </div>
        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800">
          {fireRecords.length} evento{fireRecords.length === 1 ? "" : "s"}
        </span>
      </div>

      {vedaInfo.vedaActiva && <VedaForestalBanner vedaInfo={vedaInfo} />}

      {fireRecords.length === 0 ? (
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-tertiary/10 border border-primary/30 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary">
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </span>
          <span className="text-on-surface">Sin focos de calor NASA FIRMS 2012–2026.</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {fireRecords.map((fire, i) => (
            <article
              key={i}
              className="p-2.5 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-200/70 space-y-1 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-orange-800">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-orange-200/80">
                    <span className="material-symbols-outlined text-[12px]">whatshot</span>
                  </span>
                  {fire.fecha} · {fire.hora}
                </span>
                <span className="font-mono text-[10px] bg-gradient-to-r from-orange-200 to-amber-200 px-2 py-0.5 rounded text-orange-900">
                  {fire.frpMegawatts} MW
                </span>
              </div>
              <div className="text-[11px] text-orange-900">
                <strong>{fire.sensor}:</strong> {fire.tipoIncendio}
              </div>
              <div className="text-[10px] text-orange-700/80 italic">
                {fire.indiciosDolo} · {fire.distanciaCentroideMetros} m del centroide
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function VedaForestalBanner({ vedaInfo }: { vedaInfo: ReturnType<typeof calculateVedaForestal> }): ReactElement {
  return (
    <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-300 space-y-1.5 shadow-sm">
      <div className="font-bold text-[11px] flex items-center gap-2 text-red-700">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red-200">
          <span className="material-symbols-outlined text-[14px]">gavel</span>
        </span>
        VEDA FORESTAL ACTIVA · ART. 97 LGDFS
      </div>
      <p className="text-[11px] leading-tight text-red-900/90">
        Último incendio NASA FIRMS: <strong>{vedaInfo.anoIncendio}</strong>. Predio restringido hasta {vedaInfo.anoFinVeda} ({vedaInfo.anosRestantes} años restantes).
      </p>
    </div>
  );
}
