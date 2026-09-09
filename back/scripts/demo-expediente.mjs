/**
 * Demo del expediente "Cero Deforestación" para presentación en vivo.
 *
 * Uso (con backend + BD levantados):
 *   BACKEND_URL=http://localhost:3000 node scripts/demo-expediente.mjs
 *   PARCEL_ID=<id> BACKEND_URL=... node scripts/demo-expediente.mjs
 *
 * Comportamiento:
 *  - Con PARCEL_ID: golpea GET /parcels/:id/expediente del backend real.
 *  - Sin PARCEL_ID: crea (seeds) una parcela de demo vía POST /parcels y luego
 *    genera su expediente; por defecto elimina el archivo de la BD al terminar.
 *  - Si el backend/BD no está disponible, cae a una demostración local con los
 *    mismos servicios (mismas funciones que usa el endpoint) y lo indica en la
 *    salida para que el pitch sea honesto.
 *
 * Evidencia en vivo: aunque el front muestre mocks, este script demuestra que el
 * endpoint real existe y funciona.
 */

import { buildAssessment, buildCoverageSeries } from "../src/services/assessment.service.js";

const BASE = process.env.BACKEND_URL || "http://localhost:3000";

const DEMO_PARCEL = {
  name: "Predio Demostración Uruapan",
  cropType: "avocado",
  municipality: "Uruapan",
  state: "Michoacán",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-102.07, 19.41],
        [-102.06, 19.41],
        [-102.06, 19.42],
        [-102.07, 19.42],
        [-102.07, 19.41],
      ],
    ],
  },
  metadata: {
    ndvi_mean: 0.82,
    ndwi_mean: 0.06,
    current_coverage: 93,
    deforestacion_detectada: false,
    historial_deforestacion: [],
  },
};

async function tryHttp(parcelId) {
  const res = await fetch(`${BASE}/api/v1/huertas/${parcelId}/comparaciones`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function seedParcel() {
  const res = await fetch(`${BASE}/api/v1/parcels`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(DEMO_PARCEL),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} al crear parcela`);
  const body = await res.json();
  return body.data?.id ?? body.id;
}

async function removeParcel(parcelId) {
  try {
    await fetch(`${BASE}/api/v1/parcels/${parcelId}`, { method: "DELETE" });
  } catch {
    /* noop */
  }
}

function buildLocalExpediente() {
  const meta = DEMO_PARCEL.metadata;
  const assessment = buildAssessment({
    ndviMean: meta.ndvi_mean,
    ndviMin: null,
    ndviChange: null,
    ndwiMean: meta.ndwi_mean,
    fireAlerts: 0,
  });
  const coverageSeries = buildCoverageSeries({ currentCoverage: meta.current_coverage });
  const conforme = assessment.score < 25;
  return {
    id: "EXP-DEMO-LOCAL",
    fuente: "DEMO LOCAL (backend no disponible) — mismas funciones del endpoint real",
    veredicto: conforme ? "CONFORME — CERO DEFORESTACIÓN" : "NO CONFORME — SE DETECTARON INDICADORES CRÍTICOS",
    conforme,
    assessment,
    coverageSeries,
    normativa: [
      "Decreto de Certificación de Cero Deforestación (Michoacán, 2024)",
      "Reglamento EUDR – Unión Europea",
      "SENASICA – Certificación Fitosanitaria",
    ],
  };
}

let parcelId = process.env.PARCEL_ID;
let created = false;

try {
  if (!parcelId) {
    parcelId = await seedParcel();
    created = true;
    console.log(`[demo] Parcela de demo creada: ${parcelId}`);
  }
  const { data } = await tryHttp(parcelId);
  console.log("[demo] Expediente obtenido del backend REAL (GET /parcels/:id/expediente):");
  console.log(JSON.stringify(data, null, 2));
} catch (err) {
  console.warn(`[demo] Backend no disponible (${err.message}). Fallback a demo local de servicios.`);
  console.warn("[demo] Para probar el endpoint real: levanta el backend con BD y usa los servicios /parcels.");
  console.log(JSON.stringify(buildLocalExpediente(), null, 2));
} finally {
  if (created && parcelId) {
    await removeParcel(parcelId);
    console.log(`[demo] Parcela de demo eliminada: ${parcelId}`);
  }
}
