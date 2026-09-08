const clamp = (value) => Math.max(0, Math.min(100, value));

export const buildAssessment = ({ forestCoverPercent = null, deforestationAlerts = 0, fireAlerts = 0, protectedAreaIntersection = false, waterDistanceMeters = null, ndviChangePercent = null }) => {
  const factors = {
    forestCover: forestCoverPercent == null ? null : clamp((100 - forestCoverPercent) * 0.3),
    deforestation: clamp(deforestationAlerts * 8),
    fires: clamp(fireAlerts * 5),
    protectedArea: protectedAreaIntersection ? 10 : 0,
    water: waterDistanceMeters != null && waterDistanceMeters < 100 ? 10 : 0,
    vegetationChange: ndviChangePercent != null && ndviChangePercent < -20 ? 10 : 0
  };
  const available = Object.values(factors).filter((value) => value !== null);
  const score = available.length ? Math.round(available.reduce((sum, value) => sum + value, 0) * 100) / 100 : null;
  const riskLevel = score == null ? "unknown" : score >= 60 ? "high" : score >= 30 ? "moderate" : "low";
  return { score, riskLevel, factors, limitations: ["Resultado preliminar; no sustituye una certificacion o dictamen oficial.", "Las alertas satelitales requieren verificacion de campo."] };
};
