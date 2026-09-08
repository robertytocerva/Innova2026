import type { ParcelFeature } from "../types/mapa";

export const SATELLITE_HISTORY_START = 2018;
export const SATELLITE_HISTORY_END = 2026;
export const SATELLITE_HISTORY_YEARS = Array.from(
  { length: SATELLITE_HISTORY_END - SATELLITE_HISTORY_START + 1 },
  (_, index) => SATELLITE_HISTORY_START + index,
);

export const HISTORICAL_RELEASES: Record<number, number> = {
  2018: 32337,
  2019: 9598,
  2020: 32645,
  2021: 15423,
  2022: 5314,
  2023: 46399,
  2024: 52930,
  2025: 25285,
  2026: 10842,
};

export function getWaybackUrl(year: number) {
  const releaseId = HISTORICAL_RELEASES[year] ?? HISTORICAL_RELEASES[SATELLITE_HISTORY_END];
  return `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/${releaseId}/{z}/{y}/{x}`;
}

function getTileXY(lat: number, lon: number, zoom: number) {
  const scale = 2 ** zoom;
  const x = Math.floor(((lon + 180) / 360) * scale);
  const y = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * scale,
  );
  return { x, y };
}

export function getParcelTimeSeriesUrls(parcel: ParcelFeature, zoom = 16) {
  const coordinates = parcel.geometry?.coordinates?.[0] ?? [];
  const centroid = coordinates.reduce(
    (result, [lon, lat]) => ({ lat: result.lat + lat, lon: result.lon + lon }),
    { lat: 0, lon: 0 },
  );
  const count = coordinates.length || 1;
  const lat = centroid.lat / count;
  const lon = centroid.lon / count;
  const { x, y } = getTileXY(lat, lon, zoom);

  const series = Object.fromEntries(
    SATELLITE_HISTORY_YEARS.map((year) => {
      const releaseId = HISTORICAL_RELEASES[year];
      return [
        year,
        `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/${releaseId}/${zoom}/${y}/${x}`,
      ];
    }),
  ) as Record<number, string>;

  return { lat, lon, x, y, zoom, series };
}
