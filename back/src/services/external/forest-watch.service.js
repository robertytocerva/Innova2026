import { config } from "../../config/index.js";
import { http } from "../../utils/http.js";

const baseUrl = "https://data-api.globalforestwatch.org";

export const getForestDatasets = async () => {
  const { data } = await http.get(`${baseUrl}/dataset`, { headers: config.GFW_API_TOKEN ? { Authorization: `Bearer ${config.GFW_API_TOKEN}` } : {} });
  return data;
};

export const getForestAlerts = async ({ bbox, startDate, endDate }) => {
  const params = { bbox: bbox.join(","), start_date: startDate, end_date: endDate };
  const { data } = await http.get(`${baseUrl}/v1/forest-change/alerts`, {
    params,
    headers: config.GFW_API_TOKEN ? { Authorization: `Bearer ${config.GFW_API_TOKEN}` } : {}
  });
  return data;
};
