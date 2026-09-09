import { z } from "zod";
import { createParcel, archiveParcel, findParcel, listParcels } from "../models/parcel.model.js";
import { listParcelAlerts } from "../models/monitoring.model.js";
import { notFound } from "../utils/errors.js";
import { success } from "../utils/response.js";

export const parcelQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20), offset: z.coerce.number().int().min(0).default(0), status: z.enum(["active", "archived"]).default("active") });
export const createParcelSchema = z.object({ referenceCode: z.string().trim().max(60).optional(), name: z.string().trim().min(2).max(160), cropType: z.enum(["avocado", "berries", "other"]), municipality: z.string().trim().max(120).optional(), state: z.string().trim().max(120).default("Michoacan"), geometry: z.object({ type: z.literal("Polygon"), coordinates: z.array(z.array(z.array(z.number()))).min(1) }), metadata: z.record(z.string(), z.unknown()).optional() });

export const getParcels = async (req, res) => {
  const { data, count } = await listParcels(req.query);
  success(res, data, 200, { total: count, limit: req.query.limit, offset: req.query.offset });
};

export const getParcel = async (req, res) => {
  const data = await findParcel(req.params.id);
  if (!data) throw notFound("Parcela no encontrada");
  success(res, data);
};

export const postParcel = async (req, res) => success(res, await createParcel(req.body), 201);
export const deleteParcel = async (req, res) => success(res, await archiveParcel(req.params.id));
export const getParcelAlerts = async (req, res) => success(res, await listParcelAlerts(req.params.id));
