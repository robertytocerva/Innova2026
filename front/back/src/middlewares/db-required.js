import { AppError } from "../utils/errors.js";
import { hasDatabase } from "../config/index.js";

export const dbRequired = (_req, _res, next) => {
  if (!hasDatabase) return next(new AppError("Base de datos no configurada", 503, "DATABASE_UNAVAILABLE"));
  next();
};
