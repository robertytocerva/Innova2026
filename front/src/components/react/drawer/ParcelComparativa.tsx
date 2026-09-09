import { useState, type ReactElement } from "react";
import type { ParcelFeature, AuditData, AuditResponse } from "../../../types/mapa";
import { getParcelTimeSeriesUrls, SATELLITE_HISTORY_START } from "../../../lib/satelliteHistory";
import { auditParcelYears, type AuditProgressStage } from "../../../lib/localImageAudit";
import { approveExpediente, createAuditReport, generatePdf, pdfUrl } from "../../../lib/reportApi";
import type { Expediente } from "../../../types/reports";
import { YearImage } from "./DrawerPrimitives";
import { type StatusKey } from "./drawer-styles";

const verdictLabel = (value: string): string =>
  value === "cumple" ? "Cumple" : value === "no cumple" ? "No cumple" : "Requiere revisión";

const findingTone = (value: string): string =>
  value === "cumple"
    ? "border-emerald-400/30 bg-emerald-950/30"
    : value === "no cumple"
    ? "border-red-400/30 bg-red-950/30"
    : "border-amber-400/30 bg-amber-950/30";

const sourceLabel = (type: string | undefined): string => (type === "normativa" ? "Normativa" : "Evidencia");

type ReportStage = "sources" | "approval" | "pdf";

const auditStageLabel = (stage: AuditProgressStage): string => {
  if (stage === "downloading") return "Descargando imágenes...";
  if (stage === "correlating") return "Consultando incendios...";
  return "Analizando...";
};

const reportStageLabel = (stage: ReportStage): string => {
  if (stage === "sources") return "Consultando fuentes ambientales...";
  if (stage === "approval") return "Registrando aprobación...";
  return "Generando PDF...";
};

function ReportFindings({ expediente }: { expediente: Expediente }): ReactElement | null {
  const findings = expediente.findings;
  if (!findings || findings.length === 0) return null;
  return (
    <div className="rounded-xl border border-tertiary/30 bg-black/20 p-3 text-[10px]">
      <p className="mb-2 font-bold uppercase tracking-wider text-tertiary">Por qué tiene este estado</p>
      {findings.map((finding) => (
        <article key={finding.id} className={`mb-2 rounded-lg border p-2.5 last:mb-0 ${findingTone(finding.status)}`}>
          <div className="flex items-start justify-between gap-2">
            <strong className="text-surface">{finding.criterion}</strong>
            <span className="font-bold uppercase text-tertiary">{verdictLabel(finding.status)}</span>
          </div>
          <p className="mt-1 leading-relaxed text-inverse-on-surface/80">{finding.reason}</p>
          {finding.sources && finding.sources.length > 0 && (
            <div className="mt-1 space-y-1 leading-relaxed text-inverse-on-surface/60">
              <strong>Fuentes:</strong>
              {finding.sources.map((source) => (
                <div key={`${source.url || source.title}-${source.reference}`}>
                  <span>
                    {sourceLabel(source.type)}: {source.title || "Fuente no identificada"}
                    {source.status ? ` · Estado: ${source.status}` : ""}
                    {source.reference ? ` · ${source.reference}` : ""}
                    {source.detail ? ` · ${source.detail}` : ""}
                    {source.quote ? ` · Cita: "${source.quote}"` : ""}
                  </span>
                  {source.url && (
                    <a href={source.url} target="_blank" rel="noreferrer" className="ml-1 text-tertiary underline underline-offset-2">
                      Ver fuente
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

interface Props {
  feature: ParcelFeature;
  currentYear: number;
  comparisonYear: number;
  statusKey: StatusKey;
  onParcelBlocked?: () => void;
}

export default function ParcelComparativa({ feature, currentYear, comparisonYear, statusKey, onParcelBlocked }: Props): ReactElement {
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditStage, setAuditStage] = useState<AuditProgressStage>("downloading");
  const [geminiAlert, setGeminiAlert] = useState<string | null>(null);
  const [geminiResult, setGeminiResult] = useState<AuditData | null>(null);
  const [auditResponse, setAuditResponse] = useState<AuditResponse | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [reportStage, setReportStage] = useState<ReportStage>("sources");
  const [reportError, setReportError] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<Expediente | null>(null);

  const timeSeries = getParcelTimeSeriesUrls(feature);
  const fromUrl = timeSeries.series[comparisonYear];
  const toUrl = timeSeries.series[currentYear];
  const hasSatelliteComparison = comparisonYear >= SATELLITE_HISTORY_START && currentYear >= SATELLITE_HISTORY_START;
  const canRunGemini = hasSatelliteComparison && comparisonYear < currentYear && !geminiLoading;
  const canGenerateReport = Boolean(auditResponse) && !reportLoading && !generatedReport;

  const runGemini = async (): Promise<void> => {
    if (!canRunGemini) return;
    setGeminiLoading(true);
    setAuditProgress(5);
    setAuditStage("downloading");
    setGeminiAlert(null);
    setGeminiResult(null);
    try {
      const result = await auditParcelYears(feature, comparisonYear, currentYear, ({ stage, progress }) => {
        setAuditStage(stage);
        setAuditProgress(progress);
      });
      setAuditResponse(result);
      setGeminiResult(result.data);

      if (result.data.cambio_detectado || result.data.veda_art97_activa) {
        feature.properties.deforestacionDetectada = true;
        feature.properties.exportacion = "bloqueada";
        feature.properties.subdivisionBloqueada = true;
        onParcelBlocked?.();
      }
    } catch (error) {
      setGeminiAlert(error instanceof Error ? error.message : "No fue posible ejecutar la auditoría Gemini.");
    } finally {
      setGeminiLoading(false);
    }
  };

  const generateReport = async (): Promise<void> => {
    if (!auditResponse) return;
    setReportLoading(true);
    setReportProgress(10);
    setReportStage("sources");
    setReportError(null);
    try {
      const reportFeature = {
        ...feature,
        properties: { ...feature.properties, exportacion: statusKey },
      };
      const draft = await createAuditReport(feature.properties.id, reportFeature, comparisonYear, currentYear, auditResponse);
      setReportStage("approval");
      setReportProgress(45);
      await approveExpediente(draft.expediente.folio, "Perito demostración", "auditor_demo");
      setReportStage("pdf");
      setReportProgress(70);
      const generated = await generatePdf(draft.expediente.folio);
      setReportProgress(100);
      setGeneratedReport(generated);
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "No fue posible generar el reporte.");
    } finally {
      setReportLoading(false);
    }
  };

  return (
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
        disabled={!canRunGemini}
        onClick={runGemini}
        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary via-primary-container to-primary p-[1px] transition-all hover:shadow-[0_0_20px_rgba(200,212,90,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="block rounded-[11px] bg-gradient-to-r from-primary to-primary-container px-3 py-2.5 text-[11px] font-bold text-on-primary transition-all group-hover:from-primary-container group-hover:to-primary group-disabled:opacity-50">
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            {geminiLoading ? "Analizando..." : "Auditar ambos años"}
          </span>
        </span>
      </button>

      {geminiLoading && (
        <div className="space-y-2 rounded-lg border border-tertiary/30 bg-tertiary/10 p-2.5 text-[10px] text-tertiary" role="status" aria-live="polite">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-tertiary"></span>
              {auditStageLabel(auditStage)}
            </span>
            <span className="font-mono">{auditProgress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-black/30" role="progressbar" aria-label="Progreso de auditoría" aria-valuemin={0} aria-valuemax={100} aria-valuenow={auditProgress}>
            <div className="h-full rounded-full bg-tertiary transition-[width] duration-300" style={{ width: `${auditProgress}%` }} />
          </div>
        </div>
      )}
      {geminiAlert && (
        <div className="rounded-lg border border-error/50 bg-error/10 p-2.5 text-[10px] text-red-200">{geminiAlert}</div>
      )}
      {geminiResult && <GeminiResultPanel result={geminiResult} />}

      {geminiResult && canGenerateReport && (
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
      {reportLoading && (
        <div className="space-y-2 rounded-lg border border-secondary-fixed/30 bg-secondary-fixed/10 p-2.5 text-[10px] text-secondary-fixed" role="status" aria-live="polite">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-secondary-fixed"></span>
              {reportStageLabel(reportStage)}
            </span>
            <span className="font-mono">{reportProgress}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-black/30" role="progressbar" aria-label="Progreso de generación del reporte" aria-valuemin={0} aria-valuemax={100} aria-valuenow={reportProgress}>
            <div className="h-full rounded-full bg-secondary-fixed transition-[width] duration-300" style={{ width: `${reportProgress}%` }} />
          </div>
        </div>
      )}
      {reportError && <div className="rounded-lg border border-error/50 bg-error/10 p-2.5 text-[10px] text-red-200">{reportError}</div>}
      {generatedReport && (
        <div className="space-y-2">
          <ReportFindings expediente={generatedReport} />
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
  );
}

function GeminiResultPanel({ result }: { result: AuditData }): ReactElement {
  return (
    <div className="space-y-2 rounded-xl border border-tertiary/30 bg-gradient-to-br from-black/40 to-black/20 p-3 text-[10px]">
      <div className="flex items-center justify-between border-b border-surface/10 pb-2">
        <strong className={result.cambio_detectado ? "text-error" : "text-tertiary"}>
          {result.cambio_detectado ? "CAMBIO DETECTADO" : "SIN CAMBIO CRÍTICO"}
        </strong>
        <span className="font-mono text-tertiary">{result.nivel_certeza}% certeza</span>
      </div>
      <p className="leading-relaxed text-inverse-on-surface/80">
        {result.comparativa.ano_inicial} vs {result.comparativa.ano_final}: {result.comparativa.resumen}
      </p>
      <div className="space-y-1 border-l-2 border-tertiary/50 pl-3">
        {result.cronologia_pericial.map((item, i) => (
          <div key={i}>
            <strong className="text-tertiary">{item.ano}:</strong> {item.estado}
          </div>
        ))}
      </div>
      <p className="leading-relaxed text-inverse-on-surface/80">{result.dictamen_pericial_completo}</p>
      <p className="rounded-lg bg-error/20 p-2.5 leading-relaxed text-red-200">{result.conclusion_legal}</p>
    </div>
  );
}
