import { config } from "../../config/index.js";
import { AppError } from "../../utils/errors.js";
import { calculateHistoricalVeda, getHistoricalFireRecords } from "../historical-firms.service.js";

const HISTORICAL_RELEASES = {
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

const MODEL_ALIASES = {
  "gemini-1.5-flash": "gemini-3.5-flash",
};

const getTileXY = (lat, lon, zoom = 16) => {
  const scale = 2 ** zoom;
  return {
    x: Math.floor(((lon + 180) / 360) * scale),
    y: Math.floor(((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * scale),
    zoom,
  };
};

const getParcelTileUrl = (parcel, year, zoom = 16) => {
  const coordinates = parcel.geometry.coordinates[0];
  const centroid = coordinates.reduce((result, [lon, lat]) => ({ lat: result.lat + lat, lon: result.lon + lon }), { lat: 0, lon: 0 });
  const count = coordinates.length || 1;
  const { x, y } = getTileXY(centroid.lat / count, centroid.lon / count, zoom);
  return `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/${HISTORICAL_RELEASES[year]}/${zoom}/${y}/${x}`;
};

const fetchImage = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new AppError(`No se pudo descargar la imagen satelital (${response.status})`, 502, "SATELLITE_IMAGE_ERROR");
  const contentType = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  const data = Buffer.from(await response.arrayBuffer()).toString("base64");
  return { mimeType: contentType, data };
};

export const auditParcelYearsWithGemini = async ({ parcel, fromYear, toYear }) => {
  if (!config.GEMINI_API_KEY) {
    throw new AppError("GEMINI_API_KEY no está configurada en el backend", 503, "GEMINI_NOT_CONFIGURED");
  }

  const fireRecords = getHistoricalFireRecords(parcel);
  const vedaInfo = calculateHistoricalVeda(fireRecords);
  const model = MODEL_ALIASES[config.GEMINI_MODEL] || config.GEMINI_MODEL;
  const imageYears = [fromYear, toYear];
  const images = await Promise.all(imageYears.map((year) => fetchImage(getParcelTileUrl(parcel, year))));
  const fireSummary = fireRecords.length > 0
    ? fireRecords.map((fire) => `- ${fire.fecha} ${fire.hora}: ${fire.sensor}, ${fire.tipoIncendio}, ${fire.frpMegawatts} MW, distancia ${fire.distanciaCentroideMetros}m`).join("\n")
    : "Sin incendios FIRMS relacionados con el predio entre 2012 y 2026.";
  const props = parcel.properties;
  const prompt = `
Eres un perito de teledetección forestal para Michoacán. Compara exclusivamente las dos imágenes satelitales recibidas: ${fromYear} como año inicial y ${toYear} como año final.

DATOS DEL PREDIO:
- ID: ${props.id}
- Municipio: ${props.municipio}
- Propietario: ${props.propietario}
- Superficie: ${props.superficieHa} ha
- Cultivo: ${props.cultivo}

INCENDIOS NASA FIRMS 2012-2026:
${fireSummary}

VEDA CALCULADA: ${vedaInfo.vedaActiva ? `activa hasta ${vedaInfo.anoFinVeda}` : "no activa"}.

La primera imagen corresponde a ${fromYear}; la segunda corresponde a ${toYear}. Determina si hubo pérdida de cobertura forestal, cambio a suelo desnudo o expansión de huerta. No inventes incendios ni observaciones que no sean visibles.

Devuelve JSON puro con esta estructura:
{
  "cambio_detectado": true,
  "ano_deforestacion_estimado": ${toYear},
  "incendio_registrado": true,
  "ano_incendio": 2021,
  "veda_art97_activa": ${vedaInfo.vedaActiva},
  "ano_fin_veda_art97": ${vedaInfo.anoFinVeda ?? "null"},
  "nivel_certeza": 85,
  "comparativa": { "ano_inicial": ${fromYear}, "ano_final": ${toYear}, "resumen": "Resumen visual entre ambas imágenes" },
  "cronologia_pericial": [{ "ano": ${fromYear}, "estado": "Estado observado en el año inicial" }, { "ano": ${toYear}, "estado": "Estado observado en el año final" }],
  "dictamen_pericial_completo": "Dictamen técnico",
  "conclusion_legal": "Conclusión regulatoria"
}
`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, ...images.map((image) => ({ inline_data: image }))] }],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new AppError(payload?.error?.message || `Gemini respondió con ${response.status}`, 502, "GEMINI_API_ERROR");
  const candidateText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidateText) throw new AppError("Gemini no devolvió contenido", 502, "GEMINI_EMPTY_RESPONSE");

  let data;
  try {
    data = JSON.parse(candidateText.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim());
  } catch {
    throw new AppError("Gemini devolvió un JSON inválido", 502, "GEMINI_INVALID_JSON");
  }

  return { data, fireRecords, timestamp: new Date().toISOString(), modelUsed: model };
};
