import { query } from "../config/database.js";
import { config } from "../config/index.js";
import { findParcelForAnalysis } from "../models/parcel.model.js";
import { createComparisonResult } from "../models/comparison.model.js";
import { createExpediente } from "../models/expediente.model.js";
import { getGfwDeforestationAlerts } from "./external/forest-watch.service.js";
import { getFireAlertsForPeriod } from "./external/firms.service.js";
import { compareWithProtectedAreas } from "./external/anp.service.js";
import { searchCopernicus } from "./external/copernicus.service.js";
import { evaluateComparison } from "./rule-engine.service.js";
import { notFound, AppError } from "../utils/errors.js";

const today = () => new Date().toISOString().slice(0, 10);

const parseGeometry = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value;
};

const geometryToBbox = (geometry) => {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const ring of geometry.coordinates || []) {
    for (const [longitude, latitude] of ring) {
      west = Math.min(west, longitude);
      south = Math.min(south, latitude);
      east = Math.max(east, longitude);
      north = Math.max(north, latitude);
    }
  }
  if (![west, south, east, north].every(Number.isFinite)) throw new AppError("Polígono sin coordenadas válidas", 400, "INVALID_GEOMETRY");
  return [west, south, east, north];
};

const demoValue = (metadata, key) => metadata?.reportDemo?.[key] ?? metadata?.report_demo?.[key];

export const verdictFromMapStatus = (status) => ({
  aprobada: "cumple",
  bloqueada: "no cumple",
  en_revision: "requiere revision",
}[status] || null);

const getForestResult = async ({ geometry, areaHa, cutoffDate, metadata, imageAudit, auditYears }) => {
  const auditedLoss = Number(imageAudit?.data?.comparativa?.perdidaVerdePct);
  if (Number.isFinite(auditedLoss)) {
    return {
      lossPct: auditedLoss,
      status: auditedLoss > config.FOREST_LOSS_MAX_PERCENT ? "fail" : "pass",
      source: {
        provider: imageAudit.method === "local-pixel-diff" ? "Esri Wayback local pixel diff" : "Auditoría satelital",
        status: "audit",
        baselineYear: auditYears?.fromYear,
        comparisonYear: auditYears?.toYear,
      },
      raw: { mode: "image_audit", auditedLoss },
    };
  }

  if (config.REPORT_DEMO_MODE && demoValue(metadata, "forestLossPct") !== undefined) {
    const value = Number(demoValue(metadata, "forestLossPct"));
    return {
      lossPct: value,
      status: value > config.FOREST_LOSS_MAX_PERCENT ? "fail" : "pass",
      source: { provider: "demo", status: "demo", baselineYear: 2018, cutoffDate },
      raw: { mode: "demo", value },
    };
  }

  if (!config.GFW_API_TOKEN) {
    return { lossPct: null, status: "unknown", source: { provider: "Global Forest Watch", status: "not_configured" }, raw: {} };
  }

  const alerts = await getGfwDeforestationAlerts({
    bbox: geometryToBbox(geometry),
    startDate: "2018-01-01",
    endDate: cutoffDate,
  });
  const rows = alerts?.rows || alerts?.data || alerts?.features || [];
  const lossAreaHa = rows.reduce((total, row) => {
    const properties = row.properties || row;
    const area = Number(properties.area_ha ?? properties.areaHa ?? properties.area);
    return Number.isFinite(area) ? total + area : total;
  }, 0);

  if (!rows.length || !lossAreaHa || !areaHa) {
    return {
      lossPct: null,
      status: "unknown",
      source: { provider: "Global Forest Watch", status: "alerts_without_area_statistic" },
      raw: { rows: rows.length },
    };
  }

  const lossPct = Math.min(100, (lossAreaHa / Number(areaHa)) * 100);
  return {
    lossPct,
    status: lossPct > config.FOREST_LOSS_MAX_PERCENT ? "fail" : "pass",
    source: { provider: "Global Forest Watch", status: "ok" },
    raw: { rows: rows.length, lossAreaHa },
  };
};

const getSatelliteEvidence = async ({ geometry, cutoffDate }) => {
  const result = await searchCopernicus({
    geometry,
    from: "2018-01-01",
    to: cutoffDate,
    cloudCover: 30,
    limit: 20,
  });
  const features = result?.features || [];
  return {
    status: features.length ? "ok" : "review",
    source: { provider: "Copernicus STAC", status: features.length ? "ok" : "no_scenes" },
    scenes: features.map((feature) => ({
      id: feature.id,
      capturedAt: feature.properties?.datetime || feature.properties?.start_datetime || null,
      cloudCover: feature.properties?.["eo:cloud_cover"] ?? feature.properties?.cloud_cover ?? null,
    })),
  };
};

const getStoredFireResult = async (parcelId, startDate) => {
  const { rows } = await query(
    `select detected_at from fire_alerts
     where parcel_id = $1 and detected_at >= $2
     order by detected_at desc`,
    [parcelId, startDate]
  );
  return rows;
};

const getFireResult = async ({ parcelId, geometry, metadata, cutoffDate, imageAudit }) => {
  if (imageAudit?.data?.incendio_registrado !== undefined) {
    const records = Array.isArray(imageAudit.fireRecords) ? imageAudit.fireRecords : [];
    return {
      detected: Boolean(imageAudit.data.incendio_registrado),
      count: records.length,
      lastDate: imageAudit.data.ano_incendio ? `${imageAudit.data.ano_incendio}-01-01` : null,
      status: imageAudit.data.incendio_registrado ? "fail" : "pass",
      source: { provider: "NASA FIRMS / auditoría local", status: "audit", baselineYear: 2012 },
      raw: { mode: "image_audit", records: records.length },
    };
  }

  if (config.REPORT_DEMO_MODE && demoValue(metadata, "fireDetected") !== undefined) {
    const detected = Boolean(demoValue(metadata, "fireDetected"));
    return {
      detected,
      count: Number(demoValue(metadata, "fireCount") || (detected ? 1 : 0)),
      lastDate: demoValue(metadata, "fireLastDate") || null,
      status: detected ? "fail" : "pass",
      source: { provider: "demo", status: "demo", baselineYear: 2012, cutoffDate },
      raw: { mode: "demo" },
    };
  }

  const stored = await getStoredFireResult(parcelId, "2012-01-01");
  if (stored.length) {
    return {
      detected: true,
      count: stored.length,
      lastDate: stored[0].detected_at,
      status: "fail",
      source: { provider: "NASA FIRMS", status: "database_cache" },
      raw: { cachedRows: stored.length },
    };
  }

  if (!config.FIRMS_MAP_KEY) {
    return { detected: null, count: 0, lastDate: null, status: "unknown", source: { provider: "NASA FIRMS", status: "not_configured" }, raw: {} };
  }

  const alerts = await getFireAlertsForPeriod({
    bbox: geometryToBbox(geometry),
    startDate: "2012-01-01",
    endDate: cutoffDate,
  });
  const rows = alerts?.rows || [];
  return {
    detected: rows.length > 0,
    count: rows.length,
    lastDate: rows[0]?.acq_date || null,
    status: rows.length > 0 ? "fail" : "pass",
    source: { provider: "NASA FIRMS", status: "ok", baselineYear: 2012 },
    raw: { rows: rows.length },
  };
};

const getAnpResult = async ({ geometry, metadata }) => {
  if (config.REPORT_DEMO_MODE && demoValue(metadata, "anpOverlap") !== undefined) {
    const overlap = Boolean(demoValue(metadata, "anpOverlap"));
    const overlapPct = overlap ? Number(demoValue(metadata, "anpOverlapPct") || 0) : 0;
    return {
      overlap,
      overlapPct,
      status: overlap ? "fail" : "pass",
      matches: overlap ? [{ name: "ANP demo de referencia", areaM2: null }] : [],
      source: { provider: "CONABIO", status: "demo" },
    };
  }
  return compareWithProtectedAreas(geometry);
};

const runSource = async (fn, fallback) => {
  try {
    return await fn();
  } catch (error) {
    return { ...fallback, status: "unknown", source: { ...(fallback.source || {}), status: "error", error: error.message }, raw: {} };
  }
};

export const confrontParcel = async ({ parcelId, geometry: suppliedGeometry, imageAudit = null, auditYears = null, mapSnapshot = null }) => {
  const parcel = await findParcelForAnalysis(parcelId);
  if (!parcel) throw notFound("Huerta no encontrada");

  const geometry = suppliedGeometry || parseGeometry(parcel.geometry);
  if (!geometry || geometry.type !== "Polygon") throw new AppError("Se requiere un Polygon GeoJSON", 400, "INVALID_GEOMETRY");

  const cutoffDate = today();
  const areaHa = Number(parcel.area_ha);
  const [forest, fires, anp, satellite] = await Promise.all([
    runSource(
      () => getForestResult({ geometry, areaHa, cutoffDate, metadata: parcel.metadata, imageAudit, auditYears }),
      { lossPct: null, source: { provider: "Global Forest Watch" }, raw: {} }
    ),
    runSource(
      () => getFireResult({ parcelId, geometry, metadata: parcel.metadata, cutoffDate, imageAudit }),
      { detected: null, count: 0, lastDate: null, source: { provider: "NASA FIRMS" }, raw: {} }
    ),
    runSource(
      () => getAnpResult({ geometry, metadata: parcel.metadata }),
      { overlap: null, overlapPct: null, source: { provider: "CONABIO" }, matches: [] }
    ),
    runSource(
      () => getSatelliteEvidence({ geometry, cutoffDate }),
      { scenes: [], source: { provider: "Copernicus STAC" } }
    ),
  ]);

  const calculatedDecision = evaluateComparison({
    forestLossPct: forest.lossPct ?? null,
    forestStatus: forest.status,
    forestSource: forest.source,
    fireDetected: fires.detected,
    fireStatus: fires.status,
    fireSource: fires.source,
    fireCount: fires.count,
    fireLastDate: fires.lastDate,
    anpOverlap: anp.overlap,
    anpOverlapPct: anp.overlapPct,
    anpStatus: anp.status,
    anpSource: anp.source,
  });
  const decision = calculatedDecision;

  const result = await createComparisonResult({
    parcelId,
    forestLossPct: forest.lossPct,
    forestBaselineYear: 2018,
    forestCutoffDate: cutoffDate,
    forestStatus: forest.status,
    fireDetected: fires.detected,
    fireCount: fires.count,
    fireLastDate: fires.lastDate,
    fireStatus: fires.status,
    anpOverlap: anp.overlap,
    anpOverlapPct: anp.overlapPct,
    anpStatus: anp.status,
    sources: [
      mapSnapshot ? { provider: "Mapa interactivo", status: mapSnapshot.exportacion } : null,
      forest.source,
      satellite.source,
      fires.source,
      anp.source,
    ].filter(Boolean),
    layers: { geometry, protectedAreas: anp.matches || [], satelliteScenes: satellite.scenes || [], auditYears },
    rawEvidence: {
      forest: forest.raw,
      satellite: satellite.scenes || [],
      fires: fires.raw,
      anp: anp.matches || [],
      imageAudit,
      mapSnapshot,
    },
  });

  const expediente = await createExpediente({
    parcelId,
    comparisonResultId: result.id,
    verdict: decision.verdict,
    boundaryFlag: decision.boundaryFlag,
    reasons: decision.reasons,
    findings: decision.findings,
  });

  return {
    parcel,
    comparison: result,
    decision,
    expediente,
  };
};
