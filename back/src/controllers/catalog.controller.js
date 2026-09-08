import { z } from "zod";
import { geocode } from "../services/external/geocoding.service.js";
import { getAvailableLayers } from "../services/external/layers.service.js";
import { searchSentinel } from "../services/external/sentinel.service.js";
import { success } from "../utils/response.js";

export const geocodeSchema = z.object({ q: z.string().trim().min(3).max(200) });
export const searchSatellite = async (req, res) => success(res, await searchSentinel({ geometry: req.body.geometry, from: req.body.fromDate, to: req.body.toDate, cloudCover: req.body.cloudCoverMax }));
export const geocodeLocation = async (req, res) => success(res, await geocode(req.query.q));
export const layers = async (_req, res) => success(res, getAvailableLayers());
