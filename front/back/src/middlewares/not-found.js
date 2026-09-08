import { notFound } from "../utils/errors.js";

export const notFoundHandler = (req, _res, next) => next(notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
