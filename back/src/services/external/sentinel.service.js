import { config } from "../../config/index.js";
import { http } from "../../utils/http.js";
import { AppError } from "../../utils/errors.js";

let tokenCache;
const getToken = async () => {
  if (!config.SENTINEL_HUB_CLIENT_ID || !config.SENTINEL_HUB_CLIENT_SECRET) {
    throw new AppError("Sentinel Hub no esta configurado", 503, "SENTINEL_NOT_CONFIGURED");
  }
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30000) return tokenCache.value;
  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: config.SENTINEL_HUB_CLIENT_ID, client_secret: config.SENTINEL_HUB_CLIENT_SECRET });
  const { data } = await http.post(`${config.SENTINEL_HUB_BASE_URL}/oauth/token`, body, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  tokenCache = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return tokenCache.value;
};

export const searchSentinel = async ({ geometry, from, to, cloudCover = 30 }) => {
  const token = await getToken();
  const { data } = await http.post(`${config.SENTINEL_HUB_BASE_URL}/api/v1/catalog/search`, {
    collections: ["sentinel-2-l2a"],
    intersects: geometry,
    datetime: `${from}T00:00:00Z/${to}T23:59:59Z`,
    query: { "eo:cloud_cover": { lte: cloudCover } },
    limit: 100
  }, { headers: { Authorization: `Bearer ${token}` } });
  return data;
};

export const processSentinelImage = async ({ geometry, from, to, evalscript, width = 512, height = 512 }) => {
  const token = await getToken();
  const { data } = await http.post(`${config.SENTINEL_HUB_BASE_URL}/api/v1/process`, {
    input: { bounds: { geometry }, data: [{ type: "sentinel-2-l2a", dataFilter: { timeRange: { from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z` }, mosaickingOrder: "leastCC" }, processing: { upsampling: "BILINEAR" } }] },
    output: { width, height, responses: [{ identifier: "default", format: { type: "image/png" } }] },
    evalscript
  }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, responseType: "arraybuffer" });
  return data;
};
