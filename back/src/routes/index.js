import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { validate } from "../middlewares/validate.js";
import { dbRequired } from "../middlewares/db-required.js";
import {
  getParcel, getParcelAlerts, getParcels, postParcel, deleteParcel,
  createParcelSchema, parcelQuerySchema,
} from "../controllers/parcel.controller.js";
import {
  bboxQuerySchema, monitoringSchema, monitorParcel, calculateRiskFromBbox,
  fireAlerts, weather, weatherQuerySchema,
} from "../controllers/environment.controller.js";
import {
  geocodeLocation, geocodeSchema, layers, searchSatellite,
  satelliteSearchSchema, processSatelliteImage, processImageSchema,
  imageTypes,
} from "../controllers/catalog.controller.js";
import { auditGemini, geminiAuditSchema } from "../controllers/gemini.controller.js";
import {
  seedHuertas, seedSchema, confrontHuerta, comparisonSchema, auditReportSchema, createAuditReport, getComparisons,
  getExpedientes, getExpediente, approvalSchema, approve, generatePdf, downloadPdf,
  publicVerification,
} from "../controllers/report.controller.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));
router.get("/layers", asyncHandler(layers));
router.get("/geocode", validate(geocodeSchema, "query"), asyncHandler(geocodeLocation));

router.get("/parcels", dbRequired, validate(parcelQuerySchema, "query"), asyncHandler(getParcels));
router.post("/parcels", dbRequired, validate(createParcelSchema), asyncHandler(postParcel));
router.get("/parcels/:id", dbRequired, asyncHandler(getParcel));
router.delete("/parcels/:id", dbRequired, asyncHandler(deleteParcel));
router.get("/parcels/:id/alerts", dbRequired, asyncHandler(getParcelAlerts));
router.post("/parcels/:id/monitoring", dbRequired, validate(monitoringSchema), asyncHandler(monitorParcel));

router.get("/huertas", dbRequired, validate(parcelQuerySchema, "query"), asyncHandler(getParcels));
router.post("/huertas", dbRequired, validate(createParcelSchema), asyncHandler(postParcel));
router.get("/huertas/:id", dbRequired, asyncHandler(getParcel));

router.post("/seed", dbRequired, validate(seedSchema), asyncHandler(seedHuertas));
router.post("/huertas/reference/:referenceCode/auditoria-reporte", dbRequired, validate(auditReportSchema), asyncHandler(createAuditReport));
router.get("/huertas/:id/comparaciones", dbRequired, asyncHandler(getComparisons));
router.post("/huertas/:id/comparaciones", dbRequired, validate(comparisonSchema), asyncHandler(confrontHuerta));
router.get("/expedientes", dbRequired, asyncHandler(getExpedientes));
router.get("/expedientes/:folio", dbRequired, asyncHandler(getExpediente));
router.post("/expedientes/:folio/aprobar", dbRequired, validate(approvalSchema), asyncHandler(approve));
router.post("/expedientes/:folio/generar-pdf", dbRequired, asyncHandler(generatePdf));
router.get("/expedientes/:folio/pdf", dbRequired, asyncHandler(downloadPdf));
router.get("/public/verificacion/:folio", dbRequired, asyncHandler(publicVerification));

router.post("/satellite/search", validate(satelliteSearchSchema), asyncHandler(searchSatellite));
router.post("/satellite/process", validate(processImageSchema), asyncHandler(processSatelliteImage));
router.get("/satellite/types", asyncHandler(imageTypes));

router.get("/risk/area", validate(bboxQuerySchema, "query"), asyncHandler(calculateRiskFromBbox));
router.get("/alerts/fire", validate(bboxQuerySchema, "query"), asyncHandler(fireAlerts));
router.get("/weather", validate(weatherQuerySchema, "query"), asyncHandler(weather));
router.post("/audits/gemini", validate(geminiAuditSchema), asyncHandler(auditGemini));

export default router;
