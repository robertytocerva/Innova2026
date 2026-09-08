import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";

export const errorHandler = (error, req, res, _next) => {
  const isValidation = error instanceof ZodError;
  const appError = error instanceof AppError ? error : null;
  const status = appError?.statusCode ?? (isValidation ? 400 : 500);
  const code = appError?.code ?? (isValidation ? "VALIDATION_ERROR" : "INTERNAL_ERROR");
  if (status >= 500) console.error(error);
  res.status(status).json({
    success: false,
    error: { code, message: appError?.message ?? (isValidation ? "Datos invalidos" : "Error interno"), details: appError?.details ?? (isValidation ? error.issues : undefined) }
  });
};
