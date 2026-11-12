import { timingSafeEqual } from "node:crypto";
import { config } from "../config/index.js";
import { AppError } from "../utils/errors.js";

export const sensorIngestAuth = (req, _res, next) => {
  const expected = config.SENSOR_INGEST_TOKEN;
  if (!expected) {
    return next(new AppError("La ingesta de sensores no esta configurada", 503, "SENSOR_INGEST_DISABLED"));
  }

  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return next(new AppError("Token de ingesta requerido", 401, "UNAUTHORIZED"));
  }

  const received = Buffer.from(match[1]);
  const configured = Buffer.from(expected);
  if (received.length !== configured.length || !timingSafeEqual(received, configured)) {
    return next(new AppError("Token de ingesta invalido", 401, "UNAUTHORIZED"));
  }

  next();
};
