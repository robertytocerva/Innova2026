import { useEffect, useMemo, type ReactElement } from "react";
import { calculateVedaForestal, getParcelFireRecords } from "../../lib/nasaFirms";
import type { ParcelFeature } from "../../types/mapa";
import { DEFAULT_STATUS_STYLE, resolveStatusKey, type StatusStyle } from "./drawer/drawer-styles";
import ParcelDrawerHeader from "./drawer/ParcelDrawerHeader";
import ParcelFicha from "./drawer/ParcelFicha";
import ParcelHistorial from "./drawer/ParcelHistorial";
import ParcelComparativa from "./drawer/ParcelComparativa";
import ParcelFirms from "./drawer/ParcelFirms";
import ParcelGeometry from "./drawer/ParcelGeometry";

interface Props {
  feature: ParcelFeature | null;
  open: boolean;
  onClose: () => void;
  onSelectParcel: (f: ParcelFeature) => void;
  currentYear: number;
  comparisonYear: number;
  onParcelBlocked?: () => void;
}

export default function ParcelDrawer({ feature, open, onClose, currentYear, comparisonYear, onParcelBlocked }: Props): ReactElement {
  const vedaInfo = useMemo(
    () => (feature ? calculateVedaForestal(getParcelFireRecords(feature)) : null),
    [feature],
  );

<<<<<<< HEAD
const verdictLabel = (value: string) => value === "cumple" ? "Cumple" : value === "no cumple" ? "No cumple" : "Requiere revisión";
const findingTone = (value: string) => value === "cumple" ? "border-emerald-400/30 bg-emerald-950/30" : value === "no cumple" ? "border-red-400/30 bg-red-950/30" : "border-amber-400/30 bg-amber-950/30";

export default function ParcelDrawer({ feature, open, onClose, currentYear, comparisonYear }: Props): ReactElement {
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiAlert, setGeminiAlert] = useState<string | null>(null);
  const [geminiResult, setGeminiResult] = useState<AuditData | null>(null);
  const [auditResponse, setAuditResponse] = useState<AuditResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<Expediente | null>(null);
=======
  const statusKey = feature
    ? resolveStatusKey({
        exportacion: feature.properties.exportacion,
        deforestacionDetectada: feature.properties.deforestacionDetectada,
        vedaActiva: vedaInfo?.vedaActiva ?? false,
      })
    : "en_revision";
>>>>>>> 34b228c9ff770416fab3758a8b61c0ba1feed953

  const status: StatusStyle = DEFAULT_STATUS_STYLE;

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[1200] flex items-center justify-center overflow-y-auto px-4 pt-[5.5rem] pb-6 sm:px-8 sm:pt-[6rem] sm:pb-8 transition-opacity duration-300 ease-out ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 bg-inverse-surface/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

<<<<<<< HEAD
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-label-sm font-label-sm">
<<<<<<< HEAD
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
          {geminiResult && !generatedReport && (
            <button
              type="button"
              disabled={reportLoading}
              onClick={generateReport}
              className="w-full rounded-xl bg-gradient-to-r from-tertiary to-secondary-fixed px-3 py-2.5 text-[11px] font-bold text-on-tertiary shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                {reportLoading ? "Generando reporte..." : "Generar reporte"}
              </span>
            </button>
          )}
          {reportError && <div className="rounded-lg border border-error/50 bg-error/10 p-2.5 text-[10px] text-red-200">{reportError}</div>}
          {generatedReport && (
            <div className="space-y-2">
              <div className="rounded-xl border border-tertiary/30 bg-black/20 p-3 text-[10px]">
                <p className="mb-2 font-bold uppercase tracking-wider text-tertiary">Por qué tiene este estado</p>
                {generatedReport.findings?.map((finding) => (
                  <article key={finding.id} className={`mb-2 rounded-lg border p-2.5 last:mb-0 ${findingTone(finding.status)}`}>
                    <div className="flex items-start justify-between gap-2"><strong className="text-surface">{finding.criterion}</strong><span className="font-bold uppercase text-tertiary">{verdictLabel(finding.status)}</span></div>
                    <p className="mt-1 leading-relaxed text-inverse-on-surface/80">{finding.reason}</p>
                    {finding.sources?.length ? <p className="mt-1 leading-relaxed text-inverse-on-surface/60"><strong>Fuentes:</strong> {finding.sources.map((source) => `${source.type === "normativa" ? "Normativa" : "Evidencia"}: ${source.title || "Fuente no identificada"}${source.status ? ` · Estado: ${source.status}` : ""} · ${source.reference || ""}${source.detail ? ` · ${source.detail}` : ""}`).join(" | ")}</p> : null}
                  </article>
                ))}
              </div>
              <a
                href={pdfUrl(generatedReport.folio)}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container px-3 py-2.5 text-[11px] font-bold text-on-primary shadow-md transition-all hover:shadow-lg"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Descargar reporte {generatedReport.folio}
              </a>
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
=======
        {feature && (
          <>
            <ParcelFicha feature={feature} status={status} />
            <ParcelHistorial feature={feature} />
            <ParcelComparativa
              key={feature.properties.id}
              feature={feature}
              currentYear={currentYear}
              comparisonYear={comparisonYear}
              statusKey={statusKey}
              onParcelBlocked={onParcelBlocked}
            />
            <ParcelFirms key={`firms-${feature.properties.id}`} feature={feature} />
            <ParcelGeometry key={`geometry-${feature.properties.id}`} feature={feature} />
          </>
>>>>>>> 34b228c9ff770416fab3758a8b61c0ba1feed953
        )}
=======
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="parcel-modal-title"
        className={`relative w-full max-w-2xl my-auto flex flex-col bg-gradient-to-b from-surface-container-lowest to-surface-container-low text-on-surface rounded-3xl shadow-[-12px_0_60px_-15px_rgba(0,0,0,0.5)] border border-outline-variant/40 backdrop-blur-xl max-h-[calc(100vh-7.5rem)] sm:max-h-[calc(100vh-9rem)] transition-all duration-300 ease-out ${
          open ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
      }`}
      >
        <ParcelDrawerHeader
          feature={feature ?? PLACEHOLDER_FEATURE}
          status={status}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-label-sm font-label-sm">
          {feature && (
            <>
              <ParcelFicha feature={feature} status={status} />
              <ParcelHistorial feature={feature} />
              <ParcelComparativa
                key={feature.properties.id}
                feature={feature}
                currentYear={currentYear}
                comparisonYear={comparisonYear}
                statusKey={statusKey}
                onParcelBlocked={onParcelBlocked}
              />
              <ParcelFirms key={`firms-${feature.properties.id}`} feature={feature} />
              <ParcelGeometry key={`geometry-${feature.properties.id}`} feature={feature} />
            </>
          )}
        </div>
>>>>>>> 71c3a36354f879b002b85bcce953cc5073a5286f
      </div>
    </div>
  );
}

const PLACEHOLDER_FEATURE: ParcelFeature = {
  type: "Feature",
  id: "MCH-000",
  geometry: { type: "Polygon", coordinates: [[]] },
  properties: {
    id: "MCH-000",
    propietario: "",
    municipio: "",
    superficieHa: 0,
    cultivo: "",
    fechaAlta: "",
    exportacion: "aprobada",
    deforestacionDetectada: false,
    historialDeforestacion: [],
    geometryIssues: [],
    subdivisionBloqueada: false,
    parentId: null,
    ndviPromedio: 0,
    ultimaRevision: "",
    confianzaIA: 0,
  },
};
