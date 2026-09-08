import { z } from "zod";
import { findParcel } from "../models/parcel.model.js";
import { createSession, saveAssessment } from "../models/monitoring.model.js";
import { searchSentinel } from "../services/external/sentinel.service.js";
import { getForestAlerts } from "../services/external/forest-watch.service.js";
import { getFireAlerts } from "../services/external/firms.service.js";
import { getWeather } from "../services/external/weather.service.js";
import { buildAssessment } from "../services/assessment.service.js";
import { notFound } from "../utils/errors.js";
import { success } from "../utils/response.js";

export const monitoringSchema = z.object({ fromDate: z.string().date(), toDate: z.string().date(), cloudCoverMax: z.coerce.number().min(0).max(100).default(30) });
export const externalQuerySchema = z.object({ geometry: z.object({ type: z.literal("Polygon"), coordinates: z.array(z.array(z.array(z.number()))).min(1) }), fromDate: z.string().date(), toDate: z.string().date() });
export const bboxQuerySchema = z.object({ west: z.coerce.number().min(-180).max(180), south: z.coerce.number().min(-90).max(90), east: z.coerce.number().min(-180).max(180), north: z.coerce.number().min(-90).max(90), days: z.coerce.number().int().min(1).max(5).default(5) });
export const weatherQuerySchema = z.object({ latitude: z.coerce.number().min(-90).max(90), longitude: z.coerce.number().min(-180).max(180), fromDate: z.string().date(), toDate: z.string().date() });

export const monitorParcel = async (req, res) => {
  const parcel = await findParcel(req.params.id);
  if (!parcel) throw notFound("Parcela no encontrada");
  const { fromDate, toDate, cloudCoverMax } = req.body;
  const session = await createSession({ parcel_id: parcel.id, from_date: fromDate, to_date: toDate, cloud_cover_max: cloudCoverMax, status: "running" });
  try {
    const satellite = await searchSentinel({ geometry: parcel.geometry, from: fromDate, to: toDate, cloudCover: cloudCoverMax });
    const assessment = buildAssessment({});
    const saved = await saveAssessment({ parcel_id: parcel.id, session_id: session.id, status: "completed", risk_level: assessment.riskLevel, score: assessment.score, factors: assessment.factors, limitations: assessment.limitations, assessed_at: new Date().toISOString() });
    success(res, { session, satellite, assessment: saved }, 201);
  } catch (error) {
    throw error;
  }
};

export const forestAlerts = async (req, res) => success(res, await getForestAlerts({ bbox: [req.query.west, req.query.south, req.query.east, req.query.north], startDate: req.query.fromDate, endDate: req.query.toDate }));
export const fireAlerts = async (req, res) => success(res, await getFireAlerts({ bbox: [req.query.west, req.query.south, req.query.east, req.query.north], days: req.query.days }));
export const weather = async (req, res) => success(res, await getWeather({ latitude: req.query.latitude, longitude: req.query.longitude, from: req.query.fromDate, to: req.query.toDate }));
