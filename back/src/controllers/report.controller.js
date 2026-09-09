import { z } from "zod";
import { createParcel, findParcelByReferenceCode } from "../models/parcel.model.js";
import { listParcelComparisons } from "../models/comparison.model.js";
import { approveExpediente, deleteExpediente, findExpediente, findPdf, listExpedientes } from "../models/expediente.model.js";
import { confrontParcel } from "../services/comparison.service.js";
import { generateExpedientePdf, getExpedienteBundle } from "../services/report.service.js";
import { NORMATIVE_SOURCES, REGULATORY_NOTICE } from "../services/rule-engine.service.js";
import { notFound } from "../utils/errors.js";
import { success } from "../utils/response.js";

const geometrySchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(z.array(z.number()).length(2)).min(4)).min(1),
});

const mapFeatureSchema = z.object({
  type: z.literal("Feature"),
  geometry: geometrySchema,
  properties: z.object({
    id: z.string().optional(),
    propietario: z.string().optional(),
    municipio: z.string().optional(),
    superficieHa: z.number().optional(),
    cultivo: z.string().optional(),
    exportacion: z.enum(["aprobada", "bloqueada", "en_revision"]).optional(),
  }).passthrough(),
}).passthrough();

export const comparisonSchema = z.object({ geometry: geometrySchema.optional() });
export const auditReportSchema = z.object({
  fromYear: z.coerce.number().int().min(2018).max(new Date().getFullYear()),
  toYear: z.coerce.number().int().min(2018).max(new Date().getFullYear()),
  feature: mapFeatureSchema,
  audit: z.object({
    data: z.object({
      cambio_detectado: z.boolean().optional(),
      incendio_registrado: z.boolean().optional(),
      nivel_certeza: z.number().optional(),
      comparativa: z.object({
        ano_inicial: z.number().optional(),
        ano_final: z.number().optional(),
        perdidaVerdePct: z.number().optional(),
        pixelesAnalizados: z.number().optional(),
        resumen: z.string().optional(),
      }).passthrough(),
      cronologia_pericial: z.array(z.unknown()).optional(),
      dictamen_pericial_completo: z.string().optional(),
      conclusion_legal: z.string().optional(),
      ano_incendio: z.number().nullable().optional(),
    }).passthrough(),
    fireRecords: z.array(z.unknown()).optional(),
    timestamp: z.string().optional(),
    method: z.string().optional(),
  }).passthrough(),
}).refine((value) => value.fromYear < value.toYear, {
  message: "El año final debe ser posterior al año inicial",
  path: ["toYear"],
});
export const approvalSchema = z.object({
  approvedBy: z.string().trim().min(2).max(160),
  role: z.enum(["perito_ambiental", "supervisor_tecnico", "auditor_demo"]),
});

export const seedSchema = z.object({
  huertas: z.array(z.object({
    referenceCode: z.string().trim().min(2).max(60),
    name: z.string().trim().min(2).max(160),
    cropType: z.enum(["avocado", "berries", "other"]),
    municipality: z.string().trim().max(120).optional(),
    state: z.string().trim().max(120).default("Michoacan"),
    geometry: geometrySchema,
    metadata: z.record(z.string(), z.unknown()).optional(),
  })).min(1).max(5).optional(),
});

const referenceHuertas = [
  {
    referenceCode: "MCH-001",
    name: "Huerta El Encino",
    cropType: "avocado",
    municipality: "Uruapan",
    geometry: { type: "Polygon", coordinates: [[[-102.0628, 19.4208], [-102.0618, 19.4208], [-102.0618, 19.4198], [-102.0628, 19.4198], [-102.0628, 19.4208]]] },
    metadata: { reportDemo: { forestLossPct: 0.2, fireDetected: false, fireCount: 0, anpOverlap: false } },
  },
  {
    referenceCode: "MCH-002",
    name: "Huerta San Juan",
    cropType: "avocado",
    municipality: "Tancítaro",
    geometry: { type: "Polygon", coordinates: [[[-102.3639, 19.3367], [-102.3609, 19.3367], [-102.3609, 19.3337], [-102.3639, 19.3337], [-102.3639, 19.3367]]] },
    metadata: { reportDemo: { forestLossPct: 1.35, fireDetected: true, fireCount: 1, fireLastDate: "2024-11-15", anpOverlap: false } },
  },
  {
    referenceCode: "MCH-003",
    name: "Berries La Esperanza",
    cropType: "berries",
    municipality: "Zamora",
    geometry: { type: "Polygon", coordinates: [[[-102.28, 19.98], [-102.27, 19.98], [-102.27, 19.99], [-102.28, 19.99], [-102.28, 19.98]]] },
    metadata: { reportDemo: { forestLossPct: 0.9, fireDetected: false, fireCount: 0, anpOverlap: false } },
  },
  {
    referenceCode: "MCH-004",
    name: "Huerta Los Reyes",
    cropType: "avocado",
    municipality: "Los Reyes",
    geometry: { type: "Polygon", coordinates: [[[-102.4833, 19.5933], [-102.4813, 19.5933], [-102.4813, 19.5913], [-102.4833, 19.5913], [-102.4833, 19.5933]]] },
    metadata: { reportDemo: { forestLossPct: 0.99, fireDetected: false, fireCount: 0, anpOverlap: false } },
  },
  {
    referenceCode: "MCH-005",
    name: "Predio Bosque Mixto",
    cropType: "avocado",
    municipality: "Nuevo Parangaricutiro",
    geometry: { type: "Polygon", coordinates: [[[-102.1333, 19.4167], [-102.1313, 19.4187], [-102.1293, 19.4167], [-102.1313, 19.4147], [-102.1333, 19.4167]]] },
    metadata: { reportDemo: { forestLossPct: 0.4, fireDetected: false, fireCount: 0, anpOverlap: true, anpOverlapPct: 0.4 } },
  },
];

export const seedHuertas = async (req, res) => {
  const huertas = req.body.huertas || referenceHuertas;
  const created = [];
  const existing = [];
  for (const huerta of huertas) {
    const found = await findParcelByReferenceCode(huerta.referenceCode);
    if (found) {
      existing.push(found);
      continue;
    }
    created.push(await createParcel(huerta));
  }
  success(res, { created, existing, total: created.length + existing.length }, 201);
};

export const confrontHuerta = async (req, res) => {
  const result = await confrontParcel({ parcelId: req.params.id, geometry: req.body.geometry });
  success(res, result, 201);
};

export const createAuditReport = async (req, res) => {
  const feature = req.body.feature;
  const properties = feature.properties || {};
  let parcel = await findParcelByReferenceCode(req.params.referenceCode);
  if (!parcel) {
    const cropType = /berries/i.test(properties.cultivo || "") ? "berries" : "avocado";
    parcel = await createParcel({
      referenceCode: req.params.referenceCode,
      name: properties.propietario || req.params.referenceCode,
      cropType,
      municipality: properties.municipio,
      geometry: feature.geometry,
      metadata: { mapSnapshot: properties },
    });
  }
  const result = await confrontParcel({
    parcelId: parcel.id,
    geometry: feature.geometry,
    imageAudit: req.body.audit,
    auditYears: { fromYear: req.body.fromYear, toYear: req.body.toYear },
    mapSnapshot: { ...properties, referenceCode: req.params.referenceCode },
  });
  success(res, result, 201);
};

export const getComparisons = async (req, res) => success(res, await listParcelComparisons(req.params.id));

export const getExpedientes = async (_req, res) => success(res, await listExpedientes());

export const getExpediente = async (req, res) => success(res, await getExpedienteBundle(req.params.folio));

export const approve = async (req, res) => success(res, await approveExpediente({
  folio: req.params.folio,
  approvedBy: req.body.approvedBy,
  role: req.body.role,
}));

export const generatePdf = async (req, res) => {
  const result = await generateExpedientePdf(req.params.folio);
  success(res, { ...result.expediente, downloadUrl: `/api/v1/expedientes/${result.expediente.folio}/pdf` });
};

export const downloadPdf = async (req, res) => {
  const file = await findPdf(req.params.folio);
  if (!file) throw notFound("PDF no generado para este folio");
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${file.folio}.pdf"`,
    "Content-Length": file.pdf.length,
    "X-Report-SHA256": file.pdf_sha256,
  });
  res.send(file.pdf);
};

export const publicVerification = async (req, res) => {
  const bundle = await getExpedienteBundle(req.params.folio);
  if (bundle.expediente.status !== "generated") throw notFound("El expediente todavía no está emitido públicamente");
  const snapshot = bundle.comparison.raw_evidence?.mapSnapshot || {};
  success(res, {
    valid: true,
    folio: bundle.expediente.folio,
    issuedAt: bundle.expediente.issued_at || bundle.expediente.generated_at,
    verdict: bundle.expediente.verdict,
    boundaryFlag: bundle.expediente.boundary_flag,
    reasons: bundle.expediente.reasons,
    findings: bundle.expediente.findings,
    regulatoryNotice: REGULATORY_NOTICE,
    normativeSources: Object.values(NORMATIVE_SOURCES),
    huerta: {
      referenceCode: snapshot.referenceCode || bundle.parcel.reference_code,
      name: snapshot.propietario || bundle.parcel.name,
      municipality: snapshot.municipio || bundle.parcel.municipality,
      areaHa: snapshot.superficieHa ?? bundle.parcel.area_ha,
    },
    approvedBy: bundle.expediente.approved_by,
    approverRole: bundle.expediente.approver_role,
    approvedAt: bundle.expediente.approved_at,
    pdfSha256: bundle.expediente.pdf_sha256,
  });
};

export const removeExpediente = async (req, res) => {
  const result = await deleteExpediente(req.params.folio);
  success(res, result);
};
