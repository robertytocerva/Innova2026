import { z } from "zod";
import { findParcel } from "../models/parcel.model.js";
import { createSession, saveAssessment } from "../models/monitoring.model.js";
import { getFireAlerts } from "../services/external/firms.service.js";
import { getWeather } from "../services/external/weather.service.js";
import { notFound, AppError } from "../utils/errors.js";
import { success } from "../utils/response.js";

export const monitoringSchema = z.object({
  fromDate: z.string().date(),
  toDate: z.string().date()
});

export const bboxQuerySchema = z.object({
  west: z.coerce.number().min(-180).max(180),
  south: z.coerce.number().min(-90).max(90),
  east: z.coerce.number().min(-180).max(180),
  north: z.coerce.number().min(-90).max(90),
  days: z.coerce.number().int().min(1).max(5).default(5)
});

export const weatherQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  fromDate: z.string().date(),
  toDate: z.string().date()
});

export const parcelRiskSchema = z.object({
  fromDate: z.string().date(),
  toDate: z.string().date()
});

const geometryToBbox = (geometry) => {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const ring of geometry.coordinates) {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return [minLng, minLat, maxLng, maxLat];
};

export const monitorParcel = async (req, res) => {
  const parcel = await findParcel(req.params.id);
  if (!parcel) throw notFound("Parcela no encontrada");

  const { fromDate, toDate } = req.body;
  const session = await createSession({ parcelId: parcel.id, fromDate, toDate, cloudCoverMax: 30 });

  const fireResult = await getFireAlerts({
    bbox: geometryToBbox(typeof parcel.geometry === "string" ? JSON.parse(parcel.geometry) : parcel.geometry),
    days: 5
  }).catch(() => ({ rows: [] }));

  const fireCount = fireResult?.rows?.length || 0;

  const riskScore = Math.min(100, fireCount * 15);
  const riskLevel = riskScore >= 50 ? "high" : riskScore >= 25 ? "moderate" : riskScore >= 10 ? "low" : "minimal";

  const assessment = {
    score: riskScore,
    riskLevel,
    factors: { fireAlerts: fireCount },
    recommendations: fireCount > 0
      ? ["Incendios detectados cerca del area. Verificar afectacion al huerto."]
      : ["Sin indicadores criticos de incendio detectados. Usar los endpoints de imagenes satelitales para analisis NDVI."],
    sources: ["NASA FIRMS"],
    limitations: [
      "Este analisis solo considera incendios. Para evaluacion completa usar POST /api/v1/satellite/process con tipo ndvi.",
      "Resultado preliminar; no sustituye una certificacion o dictamen oficial."
    ]
  };

  const saved = await saveAssessment({
    parcelId: parcel.id,
    sessionId: session.id,
    status: "completed",
    riskLevel: assessment.riskLevel,
    score: assessment.score,
    factors: assessment,
    limitations: assessment.limitations,
    assessedAt: new Date().toISOString()
  });

  success(res, { session, assessment: saved }, 201);
};

export const calculateRiskFromBbox = async (req, res) => {
  const { west, south, east, north } = req.query;
  const bbox = [west, south, east, north];

  const fireResult = await getFireAlerts({ bbox, days: 5 }).catch(() => ({ rows: [] }));
  const fireCount = fireResult?.rows?.length || 0;

  const riskScore = Math.min(100, fireCount * 15);
  const riskLevel = riskScore >= 50 ? "high" : riskScore >= 25 ? "moderate" : riskScore >= 10 ? "low" : "minimal";

  success(res, {
    bbox,
    assessment: {
      score: riskScore,
      riskLevel,
      factors: { fireAlerts: fireCount },
      recommendations: fireCount > 0
        ? ["Incendios detectados. Usar POST /api/v1/satellite/process para analisis NDVI."]
        : ["Sin incendios. Usar POST /api/v1/satellite/search para imagenes y POST /api/v1/satellite/process para NDVI."],
      sources: ["NASA FIRMS"]
    }
  });
};

export const fireAlerts = async (req, res) => success(res, await getFireAlerts({
  bbox: [req.query.west, req.query.south, req.query.east, req.query.north],
  days: req.query.days
}));

export const weather = async (req, res) => success(res, await getWeather({
  latitude: req.query.latitude,
  longitude: req.query.longitude,
  from: req.query.fromDate,
  to: req.query.toDate
}));
