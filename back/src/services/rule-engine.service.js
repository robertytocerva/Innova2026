import { config } from "../config/index.js";

const isNear = (value, threshold, band) => value !== null && Math.abs(value - threshold) <= band;

export const REGULATORY_NOTICE = "La certificación estatal Pro-Forest Avocado / Guardián Forestal es voluntaria; este resultado no determina por sí solo la ilegalidad ni sustituye las atribuciones de SEMARNAT y PROFEPA.";

export const NORMATIVE_SOURCES = {
  deforestation: {
    type: "normativa",
    title: "Gobierno del Estado de Michoacán — Vigente el Decreto para Certificación contra la Deforestación en Michoacán",
    organization: "Gobierno del Estado de Michoacán",
    reference: "normas.md, líneas 20–23 y 27–32, sección 1.1",
    detail: "Criterio citado: sin deforestación registrada desde enero de 2018; verificación mediante Guardián Forestal y certificadoras independientes.",
  },
  fires: {
    type: "normativa",
    title: "Gobierno del Estado de Michoacán — Vigente el Decreto para Certificación contra la Deforestación en Michoacán",
    organization: "Gobierno del Estado de Michoacán",
    reference: "normas.md, líneas 20–23 y 27–32, sección 1.1",
    detail: "Criterio citado: sin incendios registrados desde 2012.",
  },
  protectedAreas: {
    type: "normativa",
    title: "Gobierno del Estado de Michoacán — Vigente el Decreto para Certificación contra la Deforestación en Michoacán",
    organization: "Gobierno del Estado de Michoacán",
    reference: "normas.md, líneas 20–23 y 27–32, sección 1.1",
    detail: "Criterio citado: huertas fuera de áreas naturales protegidas.",
  },
  voluntaryScope: {
    type: "normativa",
    title: "Convenio APEAM–SEMARNAT–PROFEPA en materia de Cero Deforestación",
    organization: "SEMARNAT / PROFEPA / APEAM",
    reference: "normas.md, líneas 70–77 y 148–149, sección 2.1 y limitaciones",
    detail: "El convenio federal es vinculante y la certificación estatal voluntaria no lo sustituye; 'no certificado' no significa 'ilegal'.",
  },
};

const evidenceSource = (source, fallbackTitle) => ({
  type: "evidencia",
  title: source?.provider || fallbackTitle,
  status: source?.status || "consultada",
  reference: "Fuente consultada por la plataforma para este polígono",
});

const formatValue = (value, suffix = "") => value === null || value === undefined ? "sin dato" : `${Number(value).toFixed(2)}${suffix}`;

const finding = ({ id, criterion, status, reason, observation, rule, source, normativeSource }) => ({
  id,
  criterion,
  status,
  reason,
  observation,
  rule,
  sources: [normativeSource, evidenceSource(source, "Fuente de evidencia")],
});

export const evaluateComparison = ({
  forestLossPct,
  forestStatus = "unknown",
  forestSource,
  fireDetected,
  fireStatus = "unknown",
  fireSource,
  fireCount = 0,
  fireLastDate = null,
  anpOverlap,
  anpOverlapPct,
  anpStatus = "unknown",
  anpSource,
}) => {
  let critical = false;
  let review = false;
  let boundaryFlag = false;
  const findings = [];

  if (forestStatus === "fail" || (forestLossPct !== null && forestLossPct > config.FOREST_LOSS_MAX_PERCENT)) {
    critical = true;
    findings.push(finding({
      id: "deforestacion",
      criterion: "Deforestación",
      status: "no cumple",
      reason: `La pérdida forestal estimada (${formatValue(forestLossPct, "%")}) supera el umbral técnico operativo de ${config.FOREST_LOSS_MAX_PERCENT}%. Esto contradice el criterio de no registrar deforestación desde enero de 2018.`,
      observation: `Pérdida estimada: ${formatValue(forestLossPct, "%")}. Corte histórico aplicado: enero de 2018.`,
      rule: `Se marca incumplimiento cuando la medición supera ${config.FOREST_LOSS_MAX_PERCENT}% (umbral operativo configurable de la plataforma).`,
      source: forestSource,
      normativeSource: NORMATIVE_SOURCES.deforestation,
    }));
  } else if (forestStatus === "unknown" || forestLossPct === null) {
    review = true;
    findings.push(finding({
      id: "deforestacion",
      criterion: "Deforestación",
      status: "requiere revision",
      reason: "No existe una medición cuantitativa verificable de pérdida forestal para confirmar el criterio normativo.",
      observation: "La fuente no entregó una medición utilizable para el polígono.",
      rule: "La ausencia de evidencia no se considera cumplimiento; el expediente requiere revisión.",
      source: forestSource,
      normativeSource: NORMATIVE_SOURCES.deforestation,
    }));
  } else if (forestStatus === "review" || isNear(forestLossPct, config.FOREST_LOSS_MAX_PERCENT, config.FOREST_LOSS_EDGE_BAND)) {
    review = true;
    boundaryFlag = true;
    findings.push(finding({
      id: "deforestacion",
      criterion: "Deforestación",
      status: "requiere revision",
      reason: `La pérdida forestal estimada (${formatValue(forestLossPct, "%")}) está dentro de la banda límite de ±${config.FOREST_LOSS_EDGE_BAND}% del umbral técnico operativo; no es posible resolverla automáticamente con suficiente certeza.`,
      observation: `Pérdida estimada: ${formatValue(forestLossPct, "%")}. Corte histórico aplicado: enero de 2018.`,
      rule: `La banda de revisión es ±${config.FOREST_LOSS_EDGE_BAND}% alrededor del umbral operativo de ${config.FOREST_LOSS_MAX_PERCENT}%.`,
      source: forestSource,
      normativeSource: NORMATIVE_SOURCES.deforestation,
    }));
  } else {
    findings.push(finding({
      id: "deforestacion",
      criterion: "Deforestación",
      status: "cumple",
      reason: `La pérdida forestal estimada (${formatValue(forestLossPct, "%")}) no supera el umbral técnico operativo de ${config.FOREST_LOSS_MAX_PERCENT}% para el periodo desde enero de 2018.`,
      observation: `Pérdida estimada: ${formatValue(forestLossPct, "%")}. Corte histórico aplicado: enero de 2018.`,
      rule: `Se considera cumplimiento operativo cuando la medición no supera ${config.FOREST_LOSS_MAX_PERCENT}%; este porcentaje es un umbral de la plataforma, no una tolerancia textual de la norma.`,
      source: forestSource,
      normativeSource: NORMATIVE_SOURCES.deforestation,
    }));
  }

  if (fireStatus === "fail" || fireDetected === true) {
    critical = true;
    findings.push(finding({
      id: "incendios",
      criterion: "Incendios",
      status: "no cumple",
      reason: `Se detectaron ${fireCount || 1} evento(s) de incendio dentro del polígono desde 2012${fireLastDate ? `; el más reciente ocurrió el ${fireLastDate}` : ""}. Esto contradice el criterio de ausencia de incendios desde 2012.`,
      observation: `Eventos detectados: ${fireCount || 1}. Último evento: ${fireLastDate || "sin fecha"}. Corte histórico aplicado: 2012.`,
      rule: "Cualquier incendio confirmado desde 2012 activa el incumplimiento de este criterio.",
      source: fireSource,
      normativeSource: NORMATIVE_SOURCES.fires,
    }));
  } else if (fireStatus === "unknown" || fireDetected === null || fireDetected === undefined) {
    review = true;
    findings.push(finding({
      id: "incendios",
      criterion: "Incendios",
      status: "requiere revision",
      reason: "No fue posible confirmar el resultado histórico de incendios desde 2012 con la fuente consultada.",
      observation: "La fuente no entregó una confirmación concluyente para el polígono.",
      rule: "La falta de confirmación no se considera ausencia de incendios; el expediente requiere revisión.",
      source: fireSource,
      normativeSource: NORMATIVE_SOURCES.fires,
    }));
  } else if (fireStatus === "review") {
    review = true;
    boundaryFlag = true;
    findings.push(finding({
      id: "incendios",
      criterion: "Incendios",
      status: "requiere revision",
      reason: "Existen focos cercanos o evidencia de incendio con confianza insuficiente para confirmar o descartar el criterio desde 2012.",
      observation: `Eventos considerados: ${fireCount}. Último evento: ${fireLastDate || "sin fecha"}.`,
      rule: "La evidencia ambigua o de confianza insuficiente se envía a revisión pericial.",
      source: fireSource,
      normativeSource: NORMATIVE_SOURCES.fires,
    }));
  } else {
    findings.push(finding({
      id: "incendios",
      criterion: "Incendios",
      status: "cumple",
      reason: "No se detectaron incendios dentro del polígono desde 2012, por lo que la evidencia disponible satisface este criterio.",
      observation: "Eventos detectados: 0. Corte histórico aplicado: 2012.",
      rule: "Se considera cumplimiento cuando la fuente consultada no reporta incendios desde 2012.",
      source: fireSource,
      normativeSource: NORMATIVE_SOURCES.fires,
    }));
  }

  const overlapValue = anpOverlapPct ?? (anpOverlap === true ? 100 : 0);
  if (anpStatus === "fail" || anpOverlap === true) {
    critical = true;
    findings.push(finding({
      id: "areas-naturales-protegidas",
      criterion: "Áreas naturales protegidas",
      status: "no cumple",
      reason: `El polígono traslapa un Área Natural Protegida (${formatValue(overlapValue, "%")} estimado), contrario al criterio de ubicar la huerta fuera de estas áreas.`,
      observation: `Traslape estimado: ${formatValue(overlapValue, "%")}.`,
      rule: "Cualquier traslape confirmado con un Área Natural Protegida activa el incumplimiento de este criterio.",
      source: anpSource,
      normativeSource: NORMATIVE_SOURCES.protectedAreas,
    }));
  } else if (anpStatus === "unknown" || anpOverlap === null || anpOverlap === undefined) {
    review = true;
    findings.push(finding({
      id: "areas-naturales-protegidas",
      criterion: "Áreas naturales protegidas",
      status: "requiere revision",
      reason: "No fue posible confirmar el traslape con Áreas Naturales Protegidas mediante la fuente cartográfica consultada.",
      observation: "La fuente no entregó una confirmación concluyente para el polígono.",
      rule: "La falta de confirmación cartográfica no se considera ausencia de traslape; el expediente requiere revisión.",
      source: anpSource,
      normativeSource: NORMATIVE_SOURCES.protectedAreas,
    }));
  } else if (anpStatus === "review" || (overlapValue > 0 && overlapValue <= config.ANP_EDGE_BAND)) {
    review = true;
    boundaryFlag = true;
    findings.push(finding({
      id: "areas-naturales-protegidas",
      criterion: "Áreas naturales protegidas",
      status: "requiere revision",
      reason: `El traslape ANP (${formatValue(overlapValue, "%")}) está dentro de la banda cartográfica límite de ${config.ANP_EDGE_BAND}%; requiere validación pericial del límite.`,
      observation: `Traslape estimado: ${formatValue(overlapValue, "%")}.`,
      rule: `La banda cartográfica de revisión es de ${config.ANP_EDGE_BAND}%.`,
      source: anpSource,
      normativeSource: NORMATIVE_SOURCES.protectedAreas,
    }));
  } else {
    findings.push(finding({
      id: "areas-naturales-protegidas",
      criterion: "Áreas naturales protegidas",
      status: "cumple",
      reason: "No se detectó traslape con un Área Natural Protegida, por lo que la evidencia disponible satisface este criterio.",
      observation: "Traslape estimado: 0.00%.",
      rule: "Se considera cumplimiento cuando la fuente cartográfica consultada no identifica traslape.",
      source: anpSource,
      normativeSource: NORMATIVE_SOURCES.protectedAreas,
    }));
  }

  const reasons = findings.map(({ reason }) => reason);

  return {
    verdict: critical ? "no cumple" : review ? "requiere revision" : "cumple",
    boundaryFlag,
    reasons,
    findings,
    regulatoryNotice: REGULATORY_NOTICE,
    normativeSources: [NORMATIVE_SOURCES.deforestation, NORMATIVE_SOURCES.fires, NORMATIVE_SOURCES.protectedAreas, NORMATIVE_SOURCES.voluntaryScope],
    thresholds: {
      forestLossMaxPercent: config.FOREST_LOSS_MAX_PERCENT,
      forestLossEdgeBand: config.FOREST_LOSS_EDGE_BAND,
      anpEdgeBand: config.ANP_EDGE_BAND,
    },
  };
};
