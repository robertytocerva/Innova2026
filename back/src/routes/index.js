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

router.post("/satellite/search", validate(satelliteSearchSchema), asyncHandler(searchSatellite));
router.post("/satellite/process", validate(processImageSchema), asyncHandler(processSatelliteImage));
router.get("/satellite/types", asyncHandler(imageTypes));

router.get("/risk/area", validate(bboxQuerySchema, "query"), asyncHandler(calculateRiskFromBbox));
router.get("/alerts/fire", validate(bboxQuerySchema, "query"), asyncHandler(fireAlerts));
router.get("/weather", validate(weatherQuerySchema, "query"), asyncHandler(weather));

export default router;
