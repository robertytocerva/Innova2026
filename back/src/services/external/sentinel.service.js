import https from "node:https";
import { config } from "../../config/index.js";
import { http } from "../../utils/http.js";
import { AppError } from "../../utils/errors.js";

let tokenCache;

const getToken = async () => {
  if (!config.SENTINEL_HUB_CLIENT_ID || !config.SENTINEL_HUB_CLIENT_SECRET) {
    throw new AppError("Sentinel Hub no esta configurado", 503, "SENTINEL_NOT_CONFIGURED");
  }
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30000) return tokenCache.value;
  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.SENTINEL_HUB_CLIENT_ID,
      client_secret: config.SENTINEL_HUB_CLIENT_SECRET
    });
    const { data } = await http.post(`${config.SENTINEL_HUB_BASE_URL}/oauth/token`, body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });
    tokenCache = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return tokenCache.value;
  } catch (err) {
    tokenCache = null;
    throw new AppError("Sentinel Hub auth fallo", 502, "SENTINEL_AUTH_ERROR");
  }
};

const EVALSCRIPTS = {
  trueColor: {
    script: `//VERSION=3\nfunction setup(){return{input:["B02","B03","B04"],output:{bands:3,sampleType:"AUTO"}}}\nfunction evaluatePixel(s){return[s.B04*2.5,s.B03*2.5,s.B02*2.5]}`,
    format: "image/png"
  },
  falseColor: {
    script: `//VERSION=3\nfunction setup(){return{input:["B08","B04","B03"],output:{bands:3,sampleType:"AUTO"}}}\nfunction evaluatePixel(s){return[s.B08*2.5,s.B04*2.5,s.B03*2.5]}`,
    format: "image/png"
  },
  ndvi: {
    script: `//VERSION=3\nfunction setup(){return{input:["B04","B08","dataMask"],output:{bands:3,sampleType:"AUTO"}}}\nfunction evaluatePixel(s){if(s.dataMask===0)return[0,0,0];var n=(s.B08-s.B04)/(s.B08+s.B04);if(n<0)return[200,75,75];if(n<0.15)return[255,200,100];if(n<0.25)return[255,255,150];if(n<0.35)return[150,230,100];if(n<0.5)return[50,180,50];return[0,100,0]}`,
    format: "image/png"
  },
  ndwi: {
    script: `//VERSION=3\nfunction setup(){return{input:["B03","B08","dataMask"],output:{bands:3,sampleType:"AUTO"}}}\nfunction evaluatePixel(s){if(s.dataMask===0)return[128,128,128];var n=(s.B03-s.B08)/(s.B03+s.B08);if(n>0.1)return[30,100,230];if(n>0)return[100,160,230];return[200,200,200]}`,
    format: "image/png"
  }
};

const handleSentinelError = (err) => {
  tokenCache = null;
  const status = err.response?.status;
  if (status === 503) throw new AppError("Sentinel Hub Process API no disponible", 503, "SENTINEL_UNAVAILABLE");
  if (status === 401 || status === 403) throw new AppError("Sentinel Hub sin permisos", 502, "SENTINEL_FORBIDDEN");
  throw new AppError(`Sentinel Hub error: ${err.message}`, 502, "SENTINEL_ERROR");
};

const polygonToBbox = (geometry) => {
  if (!geometry || geometry.type !== "Polygon") throw new AppError("Se requiere Polygon", 400, "INVALID_GEOMETRY");
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

const nativeProcess = (token, body) => new Promise((resolve, reject) => {
  const data = JSON.stringify(body);
  const req = https.request({
    hostname: "services.sentinel-hub.com",
    path: "/api/v1/process",
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data)
    },
    timeout: 60000
  }, (res) => {
    const chunks = [];
    res.on("data", (c) => chunks.push(c));
    res.on("end", () => {
      const buffer = Buffer.concat(chunks);
      if (res.statusCode >= 400) {
        const msg = buffer.toString().slice(0, 300);
        const err = new Error(`Sentinel Hub ${res.statusCode}: ${msg}`);
        err.response = { status: res.statusCode };
        reject(err);
      } else {
        resolve({ buffer, contentType: res.headers["content-type"] || "image/png" });
      }
    });
  });
  req.on("error", reject);
  req.on("timeout", () => { req.destroy(); reject(new Error("Sentinel Hub timeout")); });
  req.write(data);
  req.end();
});

export const processSentinelImage = async ({ geometry, from, to, type = "trueColor", width = 512, height = 512 }) => {
  const entry = EVALSCRIPTS[type];
  if (!entry) throw new AppError(`Tipo no soportado: ${type}. Usa: ${Object.keys(EVALSCRIPTS).join(", ")}`, 400, "INVALID_TYPE");
  const token = await getToken();
  const bbox = polygonToBbox(geometry);
  try {
    return await nativeProcess(token, {
      input: {
        bounds: { bbox, properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" } },
        data: [{
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: { from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z` },
            mosaickingOrder: "leastCC",
            maxCloudCoverage: 30
          },
          processing: { upsampling: "BILINEAR" }
        }]
      },
      output: { width, height, responses: [{ identifier: "default", format: { type: entry.format } }] },
      evalscript: entry.script
    });
  } catch (err) {
    handleSentinelError(err);
  }
};

export const getSupportedImageTypes = () => Object.keys(EVALSCRIPTS);
