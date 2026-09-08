import { z } from "zod";
import { geocode } from "../services/external/geocoding.service.js";
import { getAvailableLayers } from "../services/external/layers.service.js";
import { searchCopernicus } from "../services/external/copernicus.service.js";
import { processSentinelImage, getSupportedImageTypes } from "../services/external/sentinel.service.js";
import { success } from "../utils/response.js";

export const geocodeSchema = z.object({ q: z.string().trim().min(3).max(200) });

export const satelliteSearchSchema = z.object({
  geometry: z.object({ type: z.literal("Polygon"), coordinates: z.array(z.array(z.array(z.number()))).min(1) }),
  fromDate: z.string().date(),
  toDate: z.string().date(),
  cloudCoverMax: z.coerce.number().min(0).max(100).default(30),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const processImageSchema = z.object({
  geometry: z.object({ type: z.literal("Polygon"), coordinates: z.array(z.array(z.array(z.number()))).min(1) }),
  fromDate: z.string().date(),
  toDate: z.string().date(),
  type: z.enum(["trueColor", "falseColor", "ndvi", "ndwi"]).default("trueColor"),
  width: z.coerce.number().int().min(64).max(2048).default(512),
  height: z.coerce.number().int().min(64).max(2048).default(512)
});

export const searchSatellite = async (req, res) => success(res, await searchCopernicus({
  geometry: req.body.geometry,
  from: req.body.fromDate,
  to: req.body.toDate,
  cloudCover: req.body.cloudCoverMax,
  limit: req.body.limit
}));

export const processSatelliteImage = async (req, res) => {
  const result = await processSentinelImage({
    geometry: req.body.geometry,
    from: req.body.fromDate,
    to: req.body.toDate,
    type: req.body.type,
    width: req.body.width,
    height: req.body.height
  });
  res.set("Content-Type", result.contentType);
  res.send(result.buffer);
};

export const geocodeLocation = async (req, res) => success(res, await geocode(req.query.q));
export const layers = async (_req, res) => success(res, getAvailableLayers());
export const imageTypes = async (_req, res) => success(res, getSupportedImageTypes());
