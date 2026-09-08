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

  const statusBadge = (() => {
    if (p.exportacion === "bloqueada" || p.deforestacionDetectada || vedaInfo.vedaActiva) {
      return { class: "bg-error/20 text-error border border-error/40", text: "BLOQUEADA" };
    }
    if (p.exportacion === "aprobada") {
      return { class: "bg-primary/20 text-on-primary-container border border-primary/40", text: "APROBADA" };
    }
    return { class: "bg-amber-500/20 text-amber-700 border border-amber-600/40", text: "EN REVISIÓN" };
  })();

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
      className={`absolute top-0 right-0 h-full w-96 max-w-full bg-surface-container-lowest text-on-surface shadow-2xl z-[1100] transition-transform duration-300 flex flex-col border-l border-outline-variant/40 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-4 bg-inverse-surface text-surface flex items-center justify-between border-b border-inverse-surface/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-primary-fixed">{p.id}</span>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${statusBadge.class}`}>
              {statusBadge.text}
            </span>
          </div>
          <p className="text-label-sm font-label-sm text-on-surface/60 mt-0.5">
            Municipio: {p.municipio} · Michoacán
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-on-surface/60 hover:text-surface hover:bg-inverse-surface/40 transition-colors"
          aria-label="Cerrar panel"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-label-sm font-label-sm">
        <section className="space-y-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">badge</span>
            Ficha del Predio
          </h3>
          <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-3 rounded-lg border border-outline-variant/40">
            <div>
              <span className="text-on-surface-variant block text-[10px]">Propietario:</span>
              <span className="font-semibold text-on-surface">{p.propietario}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[10px]">Superficie:</span>
              <span className="font-semibold text-on-surface">{p.superficieHa} ha</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[10px]">Cultivo:</span>
              <span className="font-semibold text-on-surface">{p.cultivo}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[10px]">NDVI Promedio:</span>
              <span className="font-semibold text-primary font-mono">{p.ndviPromedio ?? "0.82"}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[10px]">Fecha de Alta:</span>
              <span className="font-semibold text-on-surface">{p.fechaAlta || "2023-01-01"}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[10px]">Confianza IA:</span>
              <span className="font-semibold text-on-surface font-mono">{p.confianzaIA}%</span>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">history_toggle_off</span>
            Historial Satelital de Cobertura
          </h3>
          {p.historialDeforestacion && p.historialDeforestacion.length > 0 ? (
            <div className="space-y-2">
              {p.historialDeforestacion.map((ev, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-error-container/40 border border-error/40 text-error">
                  <div className="flex items-center justify-between font-bold text-label-sm font-label-sm">
                    <span>⚠️ {ev.tipo}</span>
                    <span className="font-mono text-[10px] text-error">{ev.fecha}</span>
                  </div>
                  <div className="text-[11px] mt-1">
                    Área talada: <strong>{ev.areaHa} ha</strong> · Sensor: <strong>{ev.fuente}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-primary-fixed/20 border border-primary-fixed/40 text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">verified</span>
              <span>Sin eventos de deforestación registrados desde 2018.</span>
            </div>
          )}
        </section>

        <section className="space-y-2 rounded-xl bg-inverse-surface p-3 text-surface">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-secondary-fixed flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">compare_arrows</span>
              Comparativa Satelital
            </h3>
            <span className="text-[9px] font-mono text-inverse-on-surface/70">Esri Wayback</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-inverse-on-surface/70">{comparisonYear} · Imagen inicial</div>
              <div className="h-24 overflow-hidden rounded-lg border border-surface/10 bg-black">
                {hasSatelliteComparison && fromUrl ? (
                  <img src={fromUrl} alt={`Imagen satelital ${comparisonYear}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[10px] text-inverse-on-surface/40">Sin imagen</div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-secondary-fixed">{currentYear} · Imagen final</div>
              <div className="h-24 overflow-hidden rounded-lg border border-secondary-fixed/30 bg-black">
                {hasSatelliteComparison && toUrl ? (
                  <img src={toUrl} alt={`Imagen satelital ${currentYear}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[10px] text-inverse-on-surface/40">Sin imagen</div>
                )}
              </div>
            </div>
          </div>
          <p className="text-[10px] leading-relaxed text-inverse-on-surface/70">
            Se compararán {comparisonYear} y {currentYear}. Los incendios FIRMS se consultan desde 2012.
          </p>
          <button
            type="button"
            disabled={!hasSatelliteComparison || comparisonYear >= currentYear || geminiLoading}
            onClick={runGemini}
            className="w-full rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-on-primary transition-colors hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">auto_awesome</span> Auditar ambos años con Gemini
            </span>
          </button>
          {geminiLoading && (
            <div className="rounded-lg border border-secondary-fixed/30 bg-surface/10 p-2 text-center text-[10px] text-secondary-fixed">
              Analizando las dos imágenes y los incendios NASA FIRMS...
            </div>
          )}
          {geminiAlert && (
            <div className="rounded-lg border border-error/50 bg-error/10 p-2 text-[10px] text-red-200">{geminiAlert}</div>
          )}
          {geminiResult && (
            <div className="space-y-2 rounded-lg border border-secondary-fixed/30 bg-black/20 p-2 text-[10px]">
              <div className="flex items-center justify-between gap-2 border-b border-surface/10 pb-1">
                <strong>{geminiResult.cambio_detectado ? "CAMBIO DE COBERTURA DETECTADO" : "COBERTURA SIN CAMBIO CRÍTICO"}</strong>
                <span className="font-mono text-secondary-fixed">{geminiResult.nivel_certeza}% certeza</span>
              </div>
              <p className="leading-relaxed text-inverse-on-surface/80">
                {geminiResult.comparativa.ano_inicial} vs {geminiResult.comparativa.ano_final}: {geminiResult.comparativa.resumen}
              </p>
              <div className="space-y-1 border-l border-secondary-fixed/50 pl-2">
                {geminiResult.cronologia_pericial.map((item, i) => (
                  <div key={i}>
                    <strong>{item.ano}:</strong> {item.estado}
                  </div>
                ))}
              </div>
              <p className="leading-relaxed text-inverse-on-surface/80">{geminiResult.dictamen_pericial_completo}</p>
              <p className="rounded bg-error/10 p-2 leading-relaxed text-red-200">{geminiResult.conclusion_legal}</p>
            </div>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-1">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-orange-600 text-[14px]">local_fire_department</span>
              Comparativa NASA FIRMS (2012–2026)
            </h3>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">
              {fireRecords.length} evento{fireRecords.length === 1 ? "" : "s"}
            </span>
          </div>
          {vedaInfo.vedaActiva && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-300 text-red-950 space-y-1">
              <div className="font-bold text-xs flex items-center gap-1 text-red-700">
                <span className="material-symbols-outlined text-[16px]">gavel</span>
                <span>VEDA FORESTAL ACTIVA (ART. 97 LGDFS)</span>
              </div>
              <p className="text-[11px] leading-tight">
                El último incendio detectado por NASA FIRMS fue en {vedaInfo.anoIncendio}. El predio queda restringido hasta {vedaInfo.anoFinVeda} ({vedaInfo.anosRestantes} años restantes).
              </p>
            </div>
          )}
          {fireRecords.length === 0 ? (
            <div className="p-2.5 rounded-lg bg-primary-fixed/20 border border-primary-fixed/40 text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">verified</span>
              <span>Sin focos de calor registrados por NASA FIRMS entre 2012 y 2026.</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {fireRecords.map((fire, i) => (
                <article key={i} className="p-2.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-950 space-y-1">
                  <div className="flex items-center justify-between gap-2 font-bold">
                    <span className="flex items-center gap-1 text-orange-800">
                      <span className="material-symbols-outlined text-xs">whatshot</span>
                      {fire.fecha} ({fire.hora})
                    </span>
                    <span className="font-mono text-[10px] bg-orange-200/80 px-1.5 py-0.5 rounded text-orange-900">{fire.frpMegawatts} MW</span>
                  </div>
                  <div className="text-[11px] text-orange-900"><strong>{fire.sensor}:</strong> {fire.tipoIncendio}</div>
                  <div className="text-[10px] text-orange-700 italic">{fire.indiciosDolo} · {fire.distanciaCentroideMetros} m del centroide</div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">polyline</span>
            Validación Geométrica (Turf.js)
          </h3>
          <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-2.5 py-2 text-[10px] text-on-surface-variant">
            <span>Comparativa contra el catastro cargado</span>
            <strong className="font-mono text-primary">{geometryValidation?.score ?? 100}/100</strong>
          </div>
          {(() => {
            const issues = (geometryValidation?.issues.length ?? 0) > 0 ? geometryValidation!.issues : p.geometryIssues;
            if (!issues || issues.length === 0) {
              return (
                <div className="p-2 rounded bg-surface-container border border-outline-variant/40 text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                  <span>Topología y cierre vectorial correctos (100/100).</span>
                </div>
              );
            }
            return (
              <div className="space-y-1.5">
                {issues.map((iss, i) => (
                  <div key={i} className="p-2 rounded bg-orange-50 border border-orange-200 text-orange-950 flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-orange-600 text-sm mt-0.5">warning</span>
                    <div>
                      <span className="font-semibold capitalize">{iss.tipo.replace("_", " ")}:</span> {iss.descripcion}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </section>

        <section className="space-y-2 pt-2 border-t border-outline-variant/40">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-error text-[14px]">gavel</span>
              Regla Anti-Subdivisión
            </h3>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-error-container text-error font-semibold">Art. 15días</span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Si un predio registra tala o cambio de uso de suelo, el sistema <strong>impide fraccionarlo</strong> para que partes limpias puedan exportar. Lo que importa es la historia total del terreno.
          </p>
          <button
            type="button"
            onClick={testSubdivision}
            className="w-full py-2.5 px-3 rounded-lg bg-inverse-surface hover:bg-on-surface text-surface font-medium flex items-center justify-center gap-1.5 shadow transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">call_split</span>
            <span>Simular Intento de Subdivisión</span>
          </button>
          {subdivisionResult && (
            subdivisionResult.allowed ? (
              <div className="p-3 rounded-lg border bg-primary-container/30 border-primary text-on-surface space-y-1">
                <div className="font-bold flex items-center gap-1 text-primary">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  SUBDIVISIÓN PERMITIDA
                </div>
                <p className="text-[11px] leading-tight">{subdivisionResult.reason}</p>
              </div>
            ) : (
              <div className="p-3 rounded-lg border bg-error-container/40 border-error text-error space-y-1">
                <div className="font-bold flex items-center gap-1 text-error">
                  <span className="material-symbols-outlined text-base">block</span>
                  SUBDIVISIÓN DENEGADA POR LEY FORESTAL
                </div>
                <p className="text-[11px] leading-tight">{subdivisionResult.reason}</p>
                <div className="mt-2 text-[10px] font-mono bg-error/10 p-1.5 rounded">
                  Dictamen: El predio no puede ser fraccionado para eludir restricciones fitosanitarias de exportación (EUDR/SENASICA).
                </div>
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
}
