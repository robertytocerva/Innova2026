import { findParcel } from "../models/parcel.model.js";
import { buildAssessment, buildCoverageSeries } from "../services/assessment.service.js";
import { canSubdivide } from "../services/subdivision.service.js";
import { notFound } from "../utils/errors.js";
import { success } from "../utils/response.js";

/**
 * GET /parcels/:id/expediente
 *
 * Genera el expediente de cumplimiento "Cero Deforestación" para un predio.
 * Combina:
 *  - Assessment (factores NDVI/NDWI/incendios/suelo desnudo)
 *  - Serie histórica de cobertura 2015–2025
 *  - Regla anti-subdivisión
 *
 * Devuelve un dictamen con trazabilidad completa para que el productor lo
 * descargue y lo presente ante autoridades / compradores / SENASICA.
 */
export const generateExpediente = async (req, res) => {
  const parcel = await findParcel(req.params.id);
  if (!parcel) throw notFound("Parcela no encontrada para generar expediente.");

  // Extrae valores del metadata o usa defaults de demo
  const meta = parcel.metadata || {};
  const ndviMean = meta.ndvi_mean ?? meta.ndviMean ?? null;
  const ndviMin = meta.ndvi_min ?? meta.ndviMin ?? null;
  const ndviChange = meta.ndvi_change ?? meta.ndviChange ?? null;
  const ndwiMean = meta.ndwi_mean ?? meta.ndwiMean ?? null;
  const fireAlerts = meta.fire_alerts ?? meta.fireAlerts ?? 0;
  const currentCoverage = meta.current_coverage ?? meta.currentCoverage ?? 90;

  // 1. Assessment con todos los factores (incluido NDWI/cuencas)
  const assessment = buildAssessment({
    ndviMean,
    ndviMin,
    ndviChange,
    ndwiMean,
    fireAlerts
  });

  // 2. Serie histórica 2015–2025
  const coverageSeries = buildCoverageSeries({ currentCoverage });

  // 3. Regla anti-subdivisión server-side
  const subdivisionCheck = canSubdivide({
    id: parcel.id || parcel.name,
    deforestacionDetectada: meta.deforestacion_detectada,
    historialDeforestacion: meta.historial_deforestacion || meta.historialDeforestacion || [],
    propietario: parcel.name,
    municipio: parcel.municipality
  });

  // 4. Veredicto Conforme / No Conforme
  const conforme = assessment.score < 25 && subdivisionCheck.allowed;
  const veredicto = conforme
    ? "CONFORME — CERO DEFORESTACIÓN"
    : "NO CONFORME — SE DETECTARON INDICADORES CRÍTICOS";

  // 5. Construcción del expediente final
  const expediente = {
    id: `EXP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    emitido: new Date().toISOString(),
    parroquia: parcel.name,
    municipio: parcel.municipality || "Michoacán",
    cultivo: parcel.crop_type || "aguacate",
    superficieHa: parcel.area_ha ?? meta.area_ha ?? null,
    conforme,
    veredicto,
    assessment: {
      ...assessment,
      recommendationSummary: conforme
        ? "Sin indicadores críticos. El predio cumple con los requisitos preliminares de conservación forestal."
        : "El predio presenta indicadores que requieren revisión antes de la certificación."
    },
    coverageSeries,
    subdivision: subdivisionCheck,
    normativa: [
      "Decreto de Certificación de Cero Deforestación (Michoacán, 2024)",
      "Reglamento EUDR – Unión Europea",
      "SENASICA – Certificación Fitosanitaria"
    ],
    limitations: [
      "Expediente preliminar generado a partir de índices espectrales. No sustituye certificación o dictamen oficial.",
      "Los valores de NDVI/NDWI requieren validación de campo.",
      "Cobertura de nubes puede afectar la precisión del análisis."
    ]
  };

  success(res, expediente);
};
