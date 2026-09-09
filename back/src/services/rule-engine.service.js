import { config } from "../config/index.js";

const isNear = (value, threshold, band) => value !== null && Math.abs(value - threshold) <= band;

export const evaluateComparison = ({
  forestLossPct,
  forestStatus = "unknown",
  fireDetected,
  fireStatus = "unknown",
  anpOverlap,
  anpOverlapPct,
  anpStatus = "unknown",
}) => {
  const reasons = [];
  let critical = false;
  let review = false;
  let boundaryFlag = false;

  if (forestStatus === "fail" || (forestLossPct !== null && forestLossPct > config.FOREST_LOSS_MAX_PERCENT)) {
    critical = true;
    reasons.push(`La pérdida forestal (${forestLossPct ?? "sin dato"}%) supera el umbral de ${config.FOREST_LOSS_MAX_PERCENT}%.`);
  } else if (forestStatus === "unknown" || forestLossPct === null) {
    review = true;
    reasons.push("No existe una medición cuantitativa verificable de pérdida forestal.");
  } else if (forestStatus === "review" || isNear(forestLossPct, config.FOREST_LOSS_MAX_PERCENT, config.FOREST_LOSS_EDGE_BAND)) {
    review = true;
    boundaryFlag = true;
    reasons.push(`La pérdida forestal está dentro de la banda límite de ±${config.FOREST_LOSS_EDGE_BAND}%.`);
  }

  if (fireStatus === "fail" || fireDetected === true) {
    critical = true;
    reasons.push("Se detectaron incendios dentro del polígono durante el periodo consultado.");
  } else if (fireStatus === "unknown" || fireDetected === null || fireDetected === undefined) {
    review = true;
    reasons.push("No fue posible confirmar el resultado histórico de incendios.");
  } else if (fireStatus === "review") {
    review = true;
    boundaryFlag = true;
    reasons.push("Existen focos cercanos o evidencia de incendio con confianza insuficiente.");
  }

  const overlapValue = anpOverlapPct ?? (anpOverlap === true ? 100 : 0);
  if (anpStatus === "fail" || anpOverlap === true) {
    critical = true;
    reasons.push(`El polígono traslapa un Área Natural Protegida (${overlapValue}% estimado).`);
  } else if (anpStatus === "unknown" || anpOverlap === null || anpOverlap === undefined) {
    review = true;
    reasons.push("No fue posible confirmar el traslape con Áreas Naturales Protegidas.");
  } else if (anpStatus === "review" || (overlapValue > 0 && overlapValue <= config.ANP_EDGE_BAND)) {
    review = true;
    boundaryFlag = true;
    reasons.push(`El traslape ANP está dentro de la banda cartográfica límite de ${config.ANP_EDGE_BAND}%.`);
  }

  if (reasons.length === 0) reasons.push("Las tres verificaciones no presentan incumplimientos ni incertidumbres.");

  return {
    verdict: critical ? "no cumple" : review ? "requiere revision" : "cumple",
    boundaryFlag,
    reasons,
    thresholds: {
      forestLossMaxPercent: config.FOREST_LOSS_MAX_PERCENT,
      forestLossEdgeBand: config.FOREST_LOSS_EDGE_BAND,
      anpEdgeBand: config.ANP_EDGE_BAND,
    },
  };
};
