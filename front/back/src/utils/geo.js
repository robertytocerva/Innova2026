import { AppError } from "./errors.js";

export const validatePolygon = (geometry) => {
  if (!geometry || geometry.type !== "Polygon" || !Array.isArray(geometry.coordinates)) {
    throw new AppError("geometry debe ser un GeoJSON Polygon", 400, "INVALID_GEOMETRY");
  }
  const ring = geometry.coordinates[0];
  if (!ring || ring.length < 4 || JSON.stringify(ring[0]) !== JSON.stringify(ring.at(-1))) {
    throw new AppError("El anillo del poligono debe estar cerrado", 400, "INVALID_GEOMETRY");
  }
  for (const point of ring) {
    if (!Array.isArray(point) || point.length !== 2 || point[0] < -180 || point[0] > 180 || point[1] < -90 || point[1] > 90) {
      throw new AppError("Coordenadas fuera de rango", 400, "INVALID_GEOMETRY");
    }
  }
  return geometry;
};

export const polygonToWkt = (geometry) => {
  validatePolygon(geometry);
  const points = geometry.coordinates[0].map(([lng, lat]) => `${lng} ${lat}`).join(", ");
  return `POLYGON((${points}))`;
};

export const pointToWkt = (longitude, latitude) => `POINT(${longitude} ${latitude})`;
