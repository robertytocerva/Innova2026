import { useState, useEffect, useMemo, type ReactElement } from "react";
import { michoacanParcels } from "../../data/michoacanParcels";
import { canSubdivide } from "../../lib/subdivisionBlocker";
import { validatePolygon } from "../../lib/geometryValidator";
import { calculateVedaForestal, getParcelFireRecords } from "../../lib/nasaFirms";
import { auditParcelYears } from "../../lib/localImageAudit";
import { getParcelTimeSeriesUrls, SATELLITE_HISTORY_START } from "../../lib/satelliteHistory";
import type { ParcelFeature, AuditData } from "../../types/mapa";

interface Props {
  feature: ParcelFeature | null;
  open: boolean;
  onClose: () => void;
  onSelectParcel: (f: ParcelFeature) => void;
  currentYear: number;
  comparisonYear: number;
  onParcelBlocked: () => void;
}

const STATUS_STYLES: Record<string, { class: string; text: string; iconBg: string }> = {
  bloqueada: { class: "bg-error/20 text-error border border-error/40", text: "BLOQUEADA", iconBg: "from-error/40 to-error/10" },
  aprobada: { class: "bg-primary/20 text-primary border border-primary/40", text: "APROBADA", iconBg: "from-primary/40 to-primary/10" },
  en_revision: { class: "bg-amber-500/20 text-amber-700 border border-amber-600/40", text: "EN REVISIÓN", iconBg: "from-amber-500/40 to-amber-600/10" },
};

function SectionIcon({ name, gradient }: { name: string; gradient: string }): ReactElement {
  return (
    <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} ring-1 ring-inset ring-white/10`}>
      <span className="material-symbols-outlined text-[14px] text-on-primary">{name}</span>
    </span>
  );
}

export default function ParcelDrawer({ feature, open, onClose, currentYear, comparisonYear, onParcelBlocked }: Props): ReactElement {
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiAlert, setGeminiAlert] = useState<string | null>(null);
  const [geminiResult, setGeminiResult] = useState<AuditData | null>(null);
  const [subdivisionResult, setSubdivisionResult] = useState<{ allowed: boolean; reason: string | null } | null>(null);

  const timeSeries = useMemo(() => (feature ? getParcelTimeSeriesUrls(feature) : null), [feature]);
  const fireRecords = useMemo(() => (feature ? getParcelFireRecords(feature) : []), [feature]);
  const vedaInfo = useMemo(() => calculateVedaForestal(fireRecords), [fireRecords]);
  const geometryValidation = useMemo(() => (feature ? validatePolygon(feature, michoacanParcels) : null), [feature]);

  useEffect(() => {
    setGeminiResult(null);
    setGeminiAlert(null);
    setSubdivisionResult(null);
  }, [feature]);

  if (!feature) return <></>;

  const p = feature.properties;
  const fromUrl = timeSeries?.series[comparisonYear];
  const toUrl = timeSeries?.series[currentYear];
  const hasSatelliteComparison = comparisonYear >= SATELLITE_HISTORY_START && currentYear >= SATELLITE_HISTORY_START;
  const statusKey = (p.exportacion === "bloqueada" || p.deforestacionDetectada || vedaInfo.vedaActiva) ? "bloqueada" : p.exportacion;
  const status = STATUS_STYLES[statusKey] ?? STATUS_STYLES.en_revision;

  const runGemini = async (): Promise<void> => {
    if (!hasSatelliteComparison || comparisonYear >= currentYear) return;
    setGeminiLoading(true);
    setGeminiAlert(null);
    setGeminiResult(null);
    try {
      const result = await auditParcelYears(feature, comparisonYear, currentYear);
      setGeminiResult(result.data);
      if (result.data.cambio_detectado || result.data.veda_art97_activa) {
        p.deforestacionDetectada = true;
        p.exportacion = "bloqueada";
        p.subdivisionBloqueada = true;
        onParcelBlocked();
      }
    } catch (error) {
      setGeminiAlert(error instanceof Error ? error.message : "No fue posible ejecutar la auditoría Gemini.");
    } finally {
      setGeminiLoading(false);
    }
  };

  const testSubdivision = (): void => {
    const res = canSubdivide(feature);
    setSubdivisionResult({ allowed: res.allowed, reason: res.reason });
  };

  return (
    <div
<<<<<<< HEAD
      className={`absolute top-0 right-0 h-full w-96 max-w-full bg-gradient-to-b from-surface-container-lowest to-surface-container-low text-on-surface shadow-[-8px_0_30px_-5px_rgba(0,0,0,0.3)] z-[1100] transition-transform duration-300 flex flex-col border-l border-outline-variant/40 ${
=======
      className={`absolute top-0 right-0 h-full w-96 max-w-full bg-surface-container-lowest text-on-surface shadow-2xl z-[1000] transition-transform duration-300 flex flex-col border-l border-outline-variant/40 ${
>>>>>>> 79d7fc8 (creacion de polingonos manuales para el mapa)
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="relative p-5 bg-gradient-to-br from-primary via-primary-container to-inverse-surface text-surface">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,212,90,0.15),transparent_60%)] pointer-events-none"></div>
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface/15 backdrop-blur-sm px-2.5 py-1 font-mono text-sm font-bold text-surface ring-1 ring-surface/20">
                <span className="material-symbols-outlined text-[14px] text-tertiary">tag</span>
                {p.id}
              </span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${status.class}`}>
                {status.text}
              </span>
            </div>
            <p className="text-label-sm font-label-sm text-on-primary/80 mt-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">place</span>
              {p.municipio} · Michoacán
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-on-primary/70 hover:text-surface hover:bg-surface/15 transition-colors"
            aria-label="Cerrar panel"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-label-sm font-label-sm">
        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <SectionIcon name="badge" gradient={status.iconBg} />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface">Ficha del Predio</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5 bg-gradient-to-br from-surface-container-low to-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/30 shadow-sm">
            <Field label="Propietario" value={p.propietario} />
            <Field label="Superficie" value={`${p.superficieHa} ha`} />
            <Field label="Cultivo" value={p.cultivo} />
            <Field label="NDVI Promedio" value={String(p.ndviPromedio ?? "0.82")} mono tone="primary" />
            <Field label="Fecha de Alta" value={p.fechaAlta || "2023-01-01"} />
            <Field label="Confianza IA" value={`${p.confianzaIA}%`} mono />
          </div>
        </section>

        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <SectionIcon name="history_toggle_off" gradient="from-error/40 to-error/10" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface">Historial Satelital</h3>
          </div>
          {p.historialDeforestacion && p.historialDeforestacion.length > 0 ? (
            <div className="space-y-2">
              {p.historialDeforestacion.map((ev, i) => (
                <div key={i} className="group p-3 rounded-xl bg-gradient-to-br from-error-container/30 to-error/5 border border-error/30 text-error transition-all hover:shadow-md hover:border-error/50">
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

        <section className="space-y-2.5 rounded-2xl bg-gradient-to-br from-inverse-surface via-primary-container to-inverse-surface p-4 text-surface shadow-lg ring-1 ring-tertiary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-tertiary/30 to-secondary-fixed/20 ring-1 ring-tertiary/40">
                <span className="material-symbols-outlined text-[14px] text-tertiary">compare_arrows</span>
              </span>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">Comparativa Satelital</h3>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-surface/10 text-inverse-on-surface/70">Esri Wayback</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <YearImage label={`${comparisonYear}`} tone="initial" src={hasSatelliteComparison ? fromUrl : undefined} />
            <YearImage label={`${currentYear}`} tone="final" src={hasSatelliteComparison ? toUrl : undefined} />
          </div>

          <p className="text-[10px] leading-relaxed text-inverse-on-surface/70">
            Se compararán <strong className="text-tertiary">{comparisonYear}</strong> y <strong className="text-tertiary">{currentYear}</strong>. Los incendios FIRMS se consultan desde 2012.
          </p>

          <button
            type="button"
            disabled={!hasSatelliteComparison || comparisonYear >= currentYear || geminiLoading}
            onClick={runGemini}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary via-primary-container to-primary p-[1px] transition-all hover:shadow-[0_0_20px_rgba(200,212,90,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="block rounded-[11px] bg-gradient-to-r from-primary to-primary-container px-3 py-2.5 text-[11px] font-bold text-on-primary transition-all group-hover:from-primary-container group-hover:to-primary group-disabled:opacity-50">
              <span className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                {geminiLoading ? "Analizando con Gemini..." : "Auditar ambos años"}
              </span>
            </span>
          </button>

          {geminiLoading && (
            <div className="flex items-center gap-2 rounded-lg border border-tertiary/30 bg-tertiary/10 p-2.5 text-[10px] text-tertiary">
              <span className="inline-block h-2 w-2 rounded-full bg-tertiary animate-pulse"></span>
              Analizando las dos imágenes y los incendios NASA FIRMS...
            </div>
          )}
          {geminiAlert && (
            <div className="rounded-lg border border-error/50 bg-error/10 p-2.5 text-[10px] text-red-200">{geminiAlert}</div>
          )}
          {geminiResult && (
            <div className="space-y-2 rounded-xl border border-tertiary/30 bg-gradient-to-br from-black/40 to-black/20 p-3 text-[10px]">
              <div className="flex items-center justify-between border-b border-surface/10 pb-2">
                <strong className={geminiResult.cambio_detectado ? "text-error" : "text-tertiary"}>
                  {geminiResult.cambio_detectado ? "CAMBIO DETECTADO" : "SIN CAMBIO CRÍTICO"}
                </strong>
                <span className="font-mono text-tertiary">{geminiResult.nivel_certeza}% certeza</span>
              </div>
              <p className="leading-relaxed text-inverse-on-surface/80">
                {geminiResult.comparativa.ano_inicial} vs {geminiResult.comparativa.ano_final}: {geminiResult.comparativa.resumen}
              </p>
              <div className="space-y-1 border-l-2 border-tertiary/50 pl-3">
                {geminiResult.cronologia_pericial.map((item, i) => (
                  <div key={i}><strong className="text-tertiary">{item.ano}:</strong> {item.estado}</div>
                ))}
              </div>
              <p className="leading-relaxed text-inverse-on-surface/80">{geminiResult.dictamen_pericial_completo}</p>
              <p className="rounded-lg bg-error/20 p-2.5 leading-relaxed text-red-200">{geminiResult.conclusion_legal}</p>
            </div>
          )}
        </section>

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

          {vedaInfo.vedaActiva && (
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
          )}

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
                <article key={i} className="p-2.5 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-200/70 space-y-1 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-orange-800">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-orange-200/80">
                        <span className="material-symbols-outlined text-[12px]">whatshot</span>
                      </span>
                      {fire.fecha} · {fire.hora}
                    </span>
                    <span className="font-mono text-[10px] bg-gradient-to-r from-orange-200 to-amber-200 px-2 py-0.5 rounded text-orange-900">{fire.frpMegawatts} MW</span>
                  </div>
                  <div className="text-[11px] text-orange-900"><strong>{fire.sensor}:</strong> {fire.tipoIncendio}</div>
                  <div className="text-[10px] text-orange-700/80 italic">{fire.indiciosDolo} · {fire.distanciaCentroideMetros} m del centroide</div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <SectionIcon name="polyline" gradient="from-tertiary/40 to-secondary-fixed/10" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface">Validación Geométrica</h3>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-surface-container-low to-surface-container px-3 py-2.5 text-[10px]">
            <span className="text-on-surface-variant">Score topológico</span>
            <strong className="font-mono text-base font-bold bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent">
              {geometryValidation?.score ?? 100}/100
            </strong>
          </div>
          {(() => {
            const issues = (geometryValidation?.issues.length ?? 0) > 0 ? geometryValidation!.issues : p.geometryIssues;
            if (!issues || issues.length === 0) {
              return (
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-tertiary/10 border border-primary/30 flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  </span>
                  <span className="text-on-surface">Topología y cierre vectorial correctos.</span>
                </div>
              );
            }
            return (
              <div className="space-y-1.5">
                {issues.map((iss, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-200/70 flex items-start gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-orange-200/80 mt-0.5">
                      <span className="material-symbols-outlined text-orange-600 text-[14px]">warning</span>
                    </span>
                    <div>
                      <span className="font-semibold capitalize text-orange-900">{iss.tipo.replace("_", " ")}:</span> {iss.descripcion}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </section>

        <section className="space-y-2.5 pt-3 border-t border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SectionIcon name="gavel" gradient="from-error/40 to-error/10" />
              <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface">Regla Anti-Subdivisión</h3>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-gradient-to-r from-error-container to-error/20 text-error font-bold ring-1 ring-error/30">Art. 15días</span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Si un predio registra tala o cambio de uso de suelo, el sistema <strong>impide fraccionarlo</strong> para que partes limpias puedan exportar.
          </p>

          <button
            type="button"
            onClick={testSubdivision}
            className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-inverse-surface to-primary-container text-surface font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:from-primary-container hover:to-inverse-surface transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">call_split</span>
            <span>Simular Intento de Subdivisión</span>
          </button>

          {subdivisionResult && (
            subdivisionResult.allowed ? (
              <div className="p-3 rounded-xl border bg-gradient-to-br from-primary-container/30 to-tertiary/10 border-primary/50 space-y-1.5 shadow-sm">
                <div className="font-bold flex items-center gap-2 text-primary">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  </span>
                  SUBDIVISIÓN PERMITIDA
                </div>
                <p className="text-[11px] leading-tight text-on-surface/90">{subdivisionResult.reason}</p>
              </div>
            ) : (
              <div className="p-3 rounded-xl border bg-gradient-to-br from-error-container/40 to-error/10 border-error/50 space-y-1.5 shadow-sm">
                <div className="font-bold flex items-center gap-2 text-error">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-error/20">
                    <span className="material-symbols-outlined text-[16px]">block</span>
                  </span>
                  SUBDIVISIÓN DENEGADA
                </div>
                <p className="text-[11px] leading-tight text-error/90">{subdivisionResult.reason}</p>
                <div className="mt-1.5 text-[10px] font-mono bg-error/10 p-2 rounded-lg text-error/80 border border-error/20">
                  Dictamen: El predio no puede ser fraccionado para eludir restricciones EUDR/SENASICA.
                </div>
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, mono = false, tone }: { label: string; value: string; mono?: boolean; tone?: "primary" }): ReactElement {
  return (
    <div>
      <span className="text-on-surface-variant block text-[10px] uppercase tracking-wider">{label}</span>
      <span className={`font-semibold text-on-surface ${mono ? "font-mono" : ""} ${tone === "primary" ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}

function YearImage({ label, src, tone }: { label: string; src: string | undefined; tone: "initial" | "final" }): ReactElement {
  const borderClass = tone === "initial" ? "border-surface/10" : "border-tertiary/30";
  const labelClass = tone === "initial" ? "text-inverse-on-surface/70" : "text-tertiary";
  return (
    <div className="space-y-1">
      <div className={`text-[10px] font-mono ${labelClass}`}>{label} · {tone === "initial" ? "Inicial" : "Final"}</div>
      <div className={`h-24 overflow-hidden rounded-xl border ${borderClass} bg-gradient-to-br from-black/60 to-black/30 shadow-inner`}>
        {src ? (
          <img src={src} alt={`Imagen satelital ${label}`} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[10px] text-inverse-on-surface/40">Sin imagen</div>
        )}
      </div>
    </div>
  );
}
