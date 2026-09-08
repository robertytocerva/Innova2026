import { config } from "../../config/index.js";
import { http } from "../../utils/http.js";
import { AppError } from "../../utils/errors.js";

const BASE_URL = "https://data-api.globalforestwatch.org";

const headers = () => (config.GFW_API_TOKEN ? { Authorization: `Bearer ${config.GFW_API_TOKEN}` } : {});

const handleGfwError = (err) => {
  const status = err.response?.status;
  const message = err.response?.data?.message || err.message;
  if (status === 429) throw new AppError("Global Forest Watch: limite de peticiones excedido", 429, "GFW_RATE_LIMIT");
  if (status >= 500) throw new AppError(`Global Forest Watch no disponible: ${message}`, 503, "GFW_UNAVAILABLE");
  throw new AppError(`Error en Global Forest Watch: ${message}`, 502, "GFW_ERROR");
};

export const getGfwDeforestationAlerts = async ({ bbox, startDate, endDate }) => {
  try {
    const { data } = await http.get(`${BASE_URL}/dataset/umd_glad_s2_alerts/latest/query`, {
      params: { sql: `SELECT * FROM data WHERE latitude > ${bbox[1]} AND latitude < ${bbox[3]} AND longitude > ${bbox[0]} AND longitude < ${bbox[2]} AND alert__date >= '${startDate}' AND alert__date <= '${endDate}' LIMIT 1000` },
      headers: headers()
    });
    return data;
  } catch (err) {
    handleGfwError(err);
  }
};
