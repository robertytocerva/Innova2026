import { z } from "zod";
import { listSensorPoints, upsertSensorPoints } from "../models/sensor-point.model.js";
import { success } from "../utils/response.js";

const sensorVertexSchema = z.object({
  id: z.string().trim().min(1).max(64),
  orden: z.number().int().min(1).max(255),
  sourceType: z.enum(["physical", "digital"]),
  status: z.enum(["active", "no_fix", "offline"]),
  lat: z.number().min(-90).max(90).nullable(),
  lon: z.number().min(-180).max(180).nullable(),
}).superRefine((point, context) => {
  if ((point.lat === null) !== (point.lon === null)) {
    context.addIssue({ code: "custom", message: "lat y lon deben ser ambos nulos o ambos numericos" });
  }
  if (point.status === "active" && (point.lat === null || point.lon === null)) {
    context.addIssue({ code: "custom", message: "Un punto activo debe tener coordenadas" });
  }
});

export const sensorPointIngestSchema = z.object({
  poligonoId: z.string().trim().min(1).max(80),
  vertices: z.array(sensorVertexSchema).min(1).max(32),
});

export const sensorPointQuerySchema = z.object({
  polygonId: z.string().trim().min(1).max(80).optional(),
});

export const ingestSensorPoints = async (req, res) => {
  const data = await upsertSensorPoints(req.body);
  success(res, data, 200, { saved: data.length });
};

export const getSensorPoints = async (req, res) => {
  success(res, await listSensorPoints(req.query));
};
