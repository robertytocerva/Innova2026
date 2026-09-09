import * as turf from "@turf/turf";
import { config } from "../../config/index.js";
import { http } from "../../utils/http.js";

const asGeometry = (value) => {
  if (!value) return null;
  if (value.type === "Feature") return value.geometry;
  if (value.type === "FeatureCollection") return null;
  return value;
};

const featuresFromGeoJson = (data) => {
  if (data?.type === "FeatureCollection") return data.features || [];
  if (data?.type === "Feature") return [data];
  if (data?.type === "Polygon" || data?.type === "MultiPolygon") return [{ type: "Feature", properties: {}, geometry: data }];
  return [];
};

export const compareWithProtectedAreas = async (geometry) => {
  if (!config.ANP_GEOJSON_URL) {
    return {
      status: "unknown",
      overlap: null,
      overlapPct: null,
      matches: [],
      source: { provider: "CONABIO", status: "not_configured" },
    };
  }

  const { data } = await http.get(config.ANP_GEOJSON_URL);
  const parcel = turf.feature(asGeometry(geometry));
  const parcelArea = turf.area(parcel);
  const matches = [];
  let overlapArea = 0;

  for (const candidate of featuresFromGeoJson(data)) {
    const candidateGeometry = asGeometry(candidate);
    if (!candidateGeometry) continue;
    try {
      const protectedArea = turf.feature(candidateGeometry, candidate.properties || {});
      const intersection = turf.intersect(turf.featureCollection([parcel, protectedArea]));
      if (!intersection) continue;
      const area = turf.area(intersection);
      overlapArea += area;
      matches.push({
        name: candidate.properties?.name || candidate.properties?.NOMBRE || candidate.properties?.nombre || "ANP sin nombre",
        areaM2: Math.round(area),
      });
    } catch {
      // Una geometría ANP defectuosa no debe ocultar el resto de las coincidencias.
    }
  }

  const overlapPct = parcelArea > 0 ? Math.min(100, (overlapArea / parcelArea) * 100) : null;
  return {
    status: overlapPct === null ? "unknown" : overlapPct > 0 ? "fail" : "pass",
    overlap: overlapPct === null ? null : overlapPct > 0,
    overlapPct,
    matches,
    source: { provider: "CONABIO", url: config.ANP_GEOJSON_URL, status: "ok" },
  };
};
