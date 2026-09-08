import { AppError } from "../../utils/errors.js";

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export const buildAssessment = ({ ndviMean = null, ndviMin = null, ndviChange = null, fireAlerts = 0, cloudCover = null }) => {
  const factors = {};

  if (ndviMean !== null) {
    factors.vegetationHealth = ndviMean < 0.1 ? 30 : ndviMean < 0.2 ? 20 : ndviMean < 0.3 ? 10 : 0;
  }

  if (ndviChange !== null) {
    factors.vegetationLoss = ndviChange < -30 ? 30 : ndviChange < -20 ? 20 : ndviChange < -10 ? 10 : 0;
  }

  factors.fireRisk = clamp(fireAlerts * 15, 0, 40);

  if (ndviMin !== null) {
    factors.bareSoil = ndviMin < 0 ? 15 : ndviMin < 0.1 ? 10 : 0;
  }

  const scores = Object.values(factors);
  const score = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100 : 0;
  const riskLevel = score >= 50 ? "high" : score >= 25 ? "moderate" : score >= 10 ? "low" : "minimal";

  const recommendations = [];
  if (factors.vegetationHealth >= 20) recommendations.push("NDVI bajo detectado: posible degradacion de cobertura vegetal.");
  if (factors.vegetationLoss >= 20) recommendations.push("Perdida significativa de vegetacion en el periodo analizado.");
  if (factors.fireRisk >= 15) recommendations.push("Incendios detectados cerca del area: verificar afectacion.");
  if (factors.bareSoil >= 10) recommendations.push("Suelo desnudo detectado: posible cambio de uso de suelo.");
  if (recommendations.length === 0) recommendations.push("Sin indicadores criticos detectados.");

  return {
    score,
    riskLevel,
    factors,
    ndvi: { mean: ndviMean, min: ndviMin, change: ndviChange },
    recommendations,
    sources: ["Sentinel-2 L2A via Copernicus STAC", "NASA FIRMS"],
    limitations: [
      "Resultado preliminar basado en indices de vegetacion. No sustituye una certificacion o dictamen oficial.",
      "Los valores de NDVI requieren validacion de campo.",
      "La cobertura de nubes puede afectar la precision del analisis."
    ]
  };
};
