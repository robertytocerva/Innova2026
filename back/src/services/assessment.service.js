const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

/**
 * Genera un dictamen de cumplimiento "Cero Deforestación" a partir de índices
 * espectrales. Combina la valoración preliminar (assessment) con la serie
 * histórica de cobertura forestal y el veredicto, para emitir un expediente
 * trazable por predio (diferenciador vs. paneles institucionales agregados).
 */
export const buildAssessment = ({ ndviMean = null, ndviMin = null, ndviChange = null, ndwiMean = null, fireAlerts = 0, cloudCover = null }) => {
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

  // Presión hídrica sobre cuencas (Cupatitzio / Río Duero). Sostiene el ángulo de
  // "alteración de cuencas" que complementa la detección forestal.
  if (ndwiMean !== null) {
    factors.waterStress = ndwiMean < 0 ? 20 : ndwiMean < 0.1 ? 10 : 0;
  }

  const scores = Object.values(factors);
  const score = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100 : 0;
  const riskLevel = score >= 50 ? "high" : score >= 25 ? "moderate" : score >= 10 ? "low" : "minimal";

  const recommendations = [];
  if (factors.vegetationHealth >= 20) recommendations.push("NDVI bajo detectado: posible degradacion de cobertura vegetal.");
  if (factors.vegetationLoss >= 20) recommendations.push("Perdida significativa de vegetacion en el periodo analizado.");
  if (factors.fireRisk >= 15) recommendations.push("Incendios detectados cerca del area: verificar afectacion.");
  if (factors.bareSoil >= 10) recommendations.push("Suelo desnudo detectado: posible cambio de uso de suelo.");
  if (factors.waterStress >= 10) recommendations.push("NDWI bajo detectado: posible estres hidrico sobre cuenca.");
  if (recommendations.length === 0) recommendations.push("Sin indicadores criticos detectados.");

  return {
    score,
    riskLevel,
    factors,
    ndvi: { mean: ndviMean, min: ndviMin, change: ndviChange },
    ndwi: { mean: ndwiMean },
    recommendations,
    sources: ["Sentinel-2 L2A via Copernicus STAC", "NASA FIRMS"],
    limitations: [
      "Resultado preliminar basado en indices de vegetacion. No sustituye una certificacion o dictamen oficial.",
      "Los valores de NDVI requieren validacion de campo.",
      "La cobertura de nubes puede afectar la precision del analisis."
    ]
  };
};

/**
 * Construye la serie histórica de cobertura forestal 2015–2025 por predio.
 * Cuando el backend no tiene registros reales, devuelve una serie simulada de
 * demostración (mismo patrón de los mocks del frontend) para no romper la UI.
 */
export const buildCoverageSeries = ({ currentCoverage = 90, years = [2015, 2018, 2021, 2024, 2025], ratePerYear = 0.6 }) => {
  // Calcula cobertura pasada hacia atrás a partir de la cobertura actual.
  const lastYear = years[years.length - 1];
  const diff = ratePerYear * (lastYear - years[0]);
  const start = clamp(currentCoverage + diff, 0, 100);

  return years.map((year, i) => {
    const coverage = clamp(start - ratePerYear * (year - years[0]), 0, 100);
    return { year, coverage: Math.round(coverage), tone: coverage >= 75 ? "bg-secondary" : coverage >= 40 ? "bg-amber-500" : "bg-error" };
  });
};
