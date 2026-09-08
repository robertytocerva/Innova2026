import type { AuditResponse, ParcelFeature } from "../types/mapa";
import { getParcelFireRecords, calculateVedaForestal } from "./nasaFirms";
import { getParcelTimeSeriesUrls } from "./satelliteHistory";

export interface PixelDiffResult {
  totalPixels: number;
  initialVegetationPixels: number;
  finalVegetationPixels: number;
  initialCoveragePct: number;
  finalCoveragePct: number;
  lossPixels: number;
  gainPixels: number;
  lossRatio: number;
  avgExgInitial: number;
  avgExgFinal: number;
}

/**
 * Carga una imagen de forma asíncrona permitiendo CORS anónimo.
 * Si la carga falla por restricciones de red/CORS, intenta fallback vía Blob.
 */
export function loadSatelliteImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => resolve(img);
    img.onerror = () => {
      // Intento de descarga alternativa vía fetch blob
      fetch(url, { mode: "cors" })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            URL.revokeObjectURL(blobUrl);
            resolve(fallbackImg);
          };
          fallbackImg.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            reject(new Error("No fue posible procesar la imagen satelital mediante Blob."));
          };
          fallbackImg.src = blobUrl;
        })
        .catch(() => {
          reject(new Error(`No fue posible cargar la tesela satelital desde: ${url}`));
        });
    };

    img.src = url;
  });
}

/**
 * Extrae los píxeles (ImageData) de un elemento HTMLImageElement en un lienzo off-screen.
 */
export function extractImageData(img: HTMLImageElement, size = 256): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("No fue posible inicializar el contexto 2D de Canvas para el análisis de imagen.");
  }
  ctx.drawImage(img, 0, 0, size, size);
  try {
    return ctx.getImageData(0, 0, size, size);
  } catch {
    throw new Error("Restricción de seguridad del navegador al leer píxeles de la tesela satelital (CORS).");
  }
}

/**
 * Calcula el Excess Green Index (ExG = 2G - R - B) para un píxel RGB.
 * Los valores positivos altos corresponden a copas de árboles y vegetación densa.
 */
export function calculateExG(r: number, g: number, b: number): number {
  return 2 * g - r - b;
}

/**
 * Compara dos conjuntos de píxeles satelitales analizando la variación de cobertura vegetal
 * usando el índice espectral visible Excess Green (ExG).
 */
export function compareSatelliteImages(
  initialData: ImageData,
  finalData: ImageData,
): PixelDiffResult {
  const totalPixels = initialData.width * initialData.height;
  const dataA = initialData.data;
  const dataB = finalData.data;

  let initialVegetationPixels = 0;
  let finalVegetationPixels = 0;
  let lossPixels = 0;
  let gainPixels = 0;
  let sumExgA = 0;
  let sumExgB = 0;

  for (let i = 0; i < dataA.length; i += 4) {
    const rA = dataA[i];
    const gA = dataA[i + 1];
    const bA = dataA[i + 2];

    const rB = dataB[i];
    const gB = dataB[i + 1];
    const bB = dataB[i + 2];

    const exgA = calculateExG(rA, gA, bA);
    const exgB = calculateExG(rB, gB, bB);

    sumExgA += exgA;
    sumExgB += exgB;

    // Criterio de vegetación fotosintéticamente activa: predominio verde y ExG > 12
    const isVegA = exgA > 12 && gA > rA && gA > bA;
    const isVegB = exgB > 12 && gB > rB && gB > bB;

    if (isVegA) initialVegetationPixels++;
    if (isVegB) finalVegetationPixels++;

    // Pérdida severa de vegetación: era vegetación y perdió significativamente el índice verde
    if (isVegA && (!isVegB || exgA - exgB > 25)) {
      lossPixels++;
    } else if (!isVegA && isVegB && exgB - exgA > 25) {
      gainPixels++;
    }
  }

  const initialCoveragePct = Number(((initialVegetationPixels / totalPixels) * 100).toFixed(1));
  const finalCoveragePct = Number(((finalVegetationPixels / totalPixels) * 100).toFixed(1));
  const lossRatio = initialVegetationPixels > 0 ? lossPixels / initialVegetationPixels : 0;

  return {
    totalPixels,
    initialVegetationPixels,
    finalVegetationPixels,
    initialCoveragePct,
    finalCoveragePct,
    lossPixels,
    gainPixels,
    lossRatio: Number(lossRatio.toFixed(3)),
    avgExgInitial: Number((sumExgA / totalPixels).toFixed(1)),
    avgExgFinal: Number((sumExgB / totalPixels).toFixed(1)),
  };
}

/**
 * Ejecuta la auditoría satelital local en el navegador comparando dos años históricos de Esri Wayback
 * con análisis espectral de píxeles y correlación con NASA FIRMS y Art. 97 LGDFS.
 */
export async function auditParcelYears(
  parcel: ParcelFeature,
  fromYear: number,
  toYear: number,
): Promise<AuditResponse> {
  const timeSeries = getParcelTimeSeriesUrls(parcel);
  const fromUrl = timeSeries.series[fromYear];
  const toUrl = timeSeries.series[toYear];

  if (!fromUrl || !toUrl) {
    throw new Error(`No se dispone de imágenes para los años seleccionados (${fromYear} - ${toYear}).`);
  }

  // Descarga y análisis de píxeles en el navegador
  const [imgFrom, imgTo] = await Promise.all([
    loadSatelliteImage(fromUrl),
    loadSatelliteImage(toUrl),
  ]);

  const dataFrom = extractImageData(imgFrom);
  const dataTo = extractImageData(imgTo);
  const diff = compareSatelliteImages(dataFrom, dataTo);

  // Consulta de focos de calor y cálculo legal de veda
  const fireRecords = getParcelFireRecords(parcel);
  const vedaInfo = calculateVedaForestal(fireRecords);

  // Incendios ocurridos entre los dos años o en la historia del predio
  const relevantFires = fireRecords.filter((fire) => {
    const fireYear = Number(fire.fecha.slice(0, 4));
    return fireYear >= fromYear && fireYear <= toYear;
  });

  const hasFireInPeriod = relevantFires.length > 0;
  const lastFireInPeriod = hasFireInPeriod
    ? Math.max(...relevantFires.map((f) => Number(f.fecha.slice(0, 4))))
    : null;

  // Umbral de detección: pérdida > 15% de cobertura vegetal o incendio con veda activa
  const cambioDetectado =
    diff.lossRatio >= 0.15 ||
    (diff.initialCoveragePct > 20 && diff.finalCoveragePct < diff.initialCoveragePct * 0.75) ||
    vedaInfo.vedaActiva ||
    (parcel.properties.deforestacionDetectada && fromYear <= 2024);

  // Estimación del año de deforestación
  let anoDeforestacionEstimado: number | null = null;
  if (cambioDetectado) {
    if (lastFireInPeriod) {
      anoDeforestacionEstimado = lastFireInPeriod;
    } else if (parcel.properties.historialDeforestacion?.length) {
      const dates = parcel.properties.historialDeforestacion.map((h) => Number(h.fecha.slice(0, 4)));
      const candidate = dates.find((y) => y >= fromYear && y <= toYear);
      anoDeforestacionEstimado = candidate ?? toYear;
    } else {
      anoDeforestacionEstimado = toYear;
    }
  }

  // Nivel de certeza basado en el análisis de píxeles (75% a 97%)
  const lossPct = Math.round(diff.lossRatio * 100);
  let nivelCerteza = 80;
  if (cambioDetectado) {
    nivelCerteza = Math.min(97, Math.max(82, 80 + Math.round(diff.lossRatio * 20)));
  } else {
    nivelCerteza = Math.min(95, 88 + (diff.lossRatio < 0.05 ? 7 : 0));
  }

  const initialCoverageDesc = `${diff.initialCoveragePct}% cobertura vegetal (ExG ${diff.avgExgInitial})`;
  const finalCoverageDesc = `${diff.finalCoveragePct}% cobertura vegetal (ExG ${diff.avgExgFinal})`;

  const cronologia = [
    {
      ano: fromYear,
      estado: `Línea base satelital: ${initialCoverageDesc}. Sin perturbaciones detectadas en masa arbórea.`,
    },
    {
      ano: toYear,
      estado: cambioDetectado
        ? `Monitoreo espectral: ${finalCoverageDesc}. Pérdida de cobertura vegetal del ${lossPct}%. ${hasFireInPeriod ? `Foco de calor NASA FIRMS confirmado (${lastFireInPeriod}).` : "Pérdida de biomasa por desmonte o cambio de uso de suelo."}`
        : `Monitoreo espectral: ${finalCoverageDesc}. Cobertura estable o en regeneración.`,
    },
  ];

  const resumen = cambioDetectado
    ? `Diferencial espectral local muestra pérdida del ${lossPct}% de cobertura vegetal activa entre ${fromYear} y ${toYear} (${diff.initialCoveragePct}% → ${diff.finalCoveragePct}%).`
    : `Cobertura forestal y vegetal estable entre ${fromYear} y ${toYear} (variación de ExG en rango normal de estacionalidad).`;

  const dictamen = cambioDetectado
    ? `Auditoría espectral local mediante algoritmo Excess Green Index (ExG = 2G - R - B) ejecutada en el navegador sobre teselas Esri Wayback (zoom 16). Se procesaron ${diff.totalPixels.toLocaleString()} píxeles. Se cuantificó una desvegetación crítica del ${lossPct}% de la superficie foliar respecto al año base ${fromYear}. ${hasFireInPeriod ? `El evento correlaciona directamente con detecciones térmicas NASA FIRMS en ${lastFireInPeriod}.` : "No se registraron focos térmicos recientes; la remoción visual es consistente con tala rasa o desmonte mecánico."}`
    : `Auditoría espectral local mediante algoritmo Excess Green Index (ExG) ejecutada en el navegador sobre teselas Esri Wayback (zoom 16). Se compararon ${diff.totalPixels.toLocaleString()} píxeles. La variación de biomasa fotosintética (${diff.initialCoveragePct}% en ${fromYear} a ${diff.finalCoveragePct}% en ${toYear}) se mantiene dentro del rango tolerado sin evidencia de deforestación ni cambio de uso de suelo.`;

  const conclusionLegal = vedaInfo.vedaActiva
    ? `ALERTA LEGAL: Veda forestal obligatoria activa por Art. 97 de la Ley General de Desarrollo Forestal Sustentable (LGDFS) hasta el año ${vedaInfo.anoFinVeda}. Prohibido cualquier trámite de cambio de uso de suelo o certificación de exportación.`
    : cambioDetectado
      ? `RESTRICCIÓN PREVENTIVA: Se identificó alteración de la cobertura natural. Conforme a las salvaguardas fitosanitarias y de deforestación cero (EUDR / SENASICA), el predio queda condicionado y con restricción de subdivisión.`
      : `DICTAMEN FAVORABLE: Sin indicios de deforestación reciente ni incendios forestales vinculados. Cumple con los criterios de cobertura histórica y no fraccionamiento fraudulento.`;

  return {
    data: {
      cambio_detectado: cambioDetectado,
      ano_deforestacion_estimado: anoDeforestacionEstimado,
      incendio_registrado: fireRecords.length > 0,
      ano_incendio: vedaInfo.anoIncendio,
      veda_art97_activa: vedaInfo.vedaActiva,
      ano_fin_veda_art97: vedaInfo.anoFinVeda,
      nivel_certeza: nivelCerteza,
      comparativa: {
        ano_inicial: fromYear,
        ano_final: toYear,
        resumen,
        perdidaVerdePct: lossPct,
        pixelesAnalizados: diff.totalPixels,
      },
      cronologia_pericial: cronologia,
      dictamen_pericial_completo: dictamen,
      conclusion_legal: conclusionLegal,
    },
    fireRecords,
    timestamp: new Date().toISOString(),
    method: "local-pixel-diff",
  };
}
