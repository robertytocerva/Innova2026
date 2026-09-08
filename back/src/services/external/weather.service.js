import { config } from "../../config/index.js";
import { http } from "../../utils/http.js";

export const getWeather = async ({ latitude, longitude, from, to }) => {
  const { data } = await http.get(`${config.OPEN_METEO_BASE_URL}/forecast`, {
    params: { latitude, longitude, start_date: from, end_date: to, daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max", timezone: "auto" }
  });
  return data;
};
