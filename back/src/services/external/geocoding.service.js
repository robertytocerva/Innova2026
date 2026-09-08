import { http } from "../../utils/http.js";

export const geocode = async (query) => {
  const { data } = await http.get("https://nominatim.openstreetmap.org/search", { params: { q: query, format: "jsonv2", limit: 5 }, headers: { "Accept-Language": "es" } });
  return data;
};
