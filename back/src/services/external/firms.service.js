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

const parseCsv = (text) => {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  if (!header) return [];
  const keys = header.split(",");
  return lines.filter(Boolean).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(keys.map((key, index) => [key, values[index]]));
  });
};
