import { z } from "zod";
import { auditParcelYearsWithGemini } from "../services/external/gemini.service.js";
import { success } from "../utils/response.js";

const currentYear = new Date().getFullYear();
const geometrySchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(z.array(z.number()))).min(1),
});

const parcelSchema = z.object({
  type: z.literal("Feature"),
  geometry: geometrySchema,
  properties: z.object({
    id: z.string(),
    propietario: z.string(),
    municipio: z.string(),
    superficieHa: z.number(),
    cultivo: z.string(),
    parentId: z.string().nullable().optional(),
  }).passthrough(),
}).passthrough();

export const geminiAuditSchema = z.object({
  parcel: parcelSchema,
  fromYear: z.coerce.number().int().min(2018).max(currentYear),
  toYear: z.coerce.number().int().min(2018).max(currentYear),
}).refine((value) => value.fromYear < value.toYear, {
  message: "El año final debe ser posterior al año inicial",
  path: ["toYear"],
});

export const auditGemini = async (req, res) => {
  success(res, await auditParcelYearsWithGemini(req.body));
};
