import { config } from "../../config/index.js";
import { http } from "../../utils/http.js";
import { AppError } from "../../utils/errors.js";

export const getFireAlerts = async ({ bbox, days = 5, source = "VIIRS_NOAA20_NRT" }) => {
  if (!config.FIRMS_MAP_KEY) throw new AppError("FIRMS no esta configurado", 503, "FIRMS_NOT_CONFIGURED");
  const [west, south, east, north] = bbox;
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${config.FIRMS_MAP_KEY}/${source}/${west},${south},${east},${north}/${days}`;
  const { data } = await http.get(url, { responseType: "text" });
  return { source, rows: parseCsv(data) };
};

export const getFireAlertsForPeriod = async ({ bbox, startDate, endDate, source = "VIIRS_NOAA20_NRT" }) => {
  const from = new Date(`${startDate}T00:00:00Z`).getTime();
  const to = new Date(`${endDate}T23:59:59Z`).getTime();
  const days = Math.ceil((to - from) / 86400000);

  // The FIRMS area endpoint only supports a short recent window. Historical
  // evidence must come from the local fire_alerts cache or an archive export.
  if (!Number.isFinite(days) || days < 1 || days > 10) {
    throw new AppError("NASA FIRMS requiere un cache histórico o un export de archivo para este periodo", 503, "FIRMS_ARCHIVE_REQUIRED");
  }

  return getFireAlerts({ bbox, days, source });
};

const parseCsv = (text) => {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  if (!header) return [];
  const keys = header.split(",");
  return lines.filter(Boolean).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(keys.map((key, index) => [key, values[index]]));
  });
};
