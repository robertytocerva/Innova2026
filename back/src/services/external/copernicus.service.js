import { config } from "../../config/index.js";
import { http } from "../../utils/http.js";
import { AppError } from "../../utils/errors.js";

const STAC_URL = "https://stac.dataspace.copernicus.eu/v1";

const handleStacError = (err) => {
  const status = err.response?.status;
  const message = err.response?.data?.description || err.message;
  if (status === 429) throw new AppError("Copernicus: limite de peticiones excedido", 429, "STAC_RATE_LIMIT");
  if (status >= 500) throw new AppError(`Copernicus STAC no disponible: ${message}`, 503, "STAC_UNAVAILABLE");
  throw new AppError(`Error en Copernicus STAC: ${message}`, 502, "STAC_ERROR");
};

const polygonToBbox = (geometry) => {
  if (!geometry || geometry.type !== "Polygon") throw new AppError("Se requiere un Polygon GeoJSON", 400, "INVALID_GEOMETRY");
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const ring of geometry.coordinates) {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return [minLng, minLat, maxLng, maxLat];
};

export const searchCopernicus = async ({ geometry, from, to, cloudCover = 30, limit = 50 }) => {
  const bbox = polygonToBbox(geometry);
  try {
    const { data } = await http.get(`${STAC_URL}/collections/sentinel-2-l2a/items`, {
      params: {
        bbox: bbox.join(","),
        datetime: `${from}T00:00:00Z/${to}T23:59:59Z`,
        limit
      }
    });
    const items = (data.features || []).filter((item) => {
      const cc = item.properties?.["eo:cloud_cover"] ?? item.properties?.cloud_cover ?? 100;
      return cc <= cloudCover;
    });
    return { ...data, features: items };
  } catch (err) {
    handleStacError(err);
  }
};
