import { AppError } from "../utils/errors.js";
import { hasSupabase } from "../config/index.js";

export const supabaseRequired = (_req, _res, next) => {
  if (!hasSupabase) return next(new AppError("Supabase no esta configurado", 503, "DATABASE_UNAVAILABLE"));
  next();
};
