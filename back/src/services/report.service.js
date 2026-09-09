import crypto from "node:crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { config } from "../config/index.js";
import { findParcelForAnalysis } from "../models/parcel.model.js";
import { findComparison } from "../models/comparison.model.js";
import { findExpediente, savePdf } from "../models/expediente.model.js";
import { AppError, notFound } from "../utils/errors.js";

const formatDate = (value) => value ? new Date(value).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "No disponible";
const formatPercent = (value) => value === null || value === undefined ? "No disponible" : `${Number(value).toFixed(2)}%`;
const reportText = (value) => String(value || "No disponible")
  .replace(/(?:Se procesaron|Se compararon) [\d.,]+ píxeles\.\s*/gi, "")
  .replace(/\b[\d.,]+ píxeles\b/gi, "la muestra analizada");

const reportUrl = (folio) => {
  const separator = config.PUBLIC_VERIFICATION_URL.includes("?") ? "&" : "?";
  return `${config.PUBLIC_VERIFICATION_URL}${separator}folio=${encodeURIComponent(folio)}`;
};

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

const getTileUrl = (geometry, year, zoom = 16) => {
  const points = geometry?.coordinates?.[0] || [];
  if (!points.length) return null;
  const centroid = points.reduce((result, [lng, lat]) => ({
    lng: result.lng + lng / points.length,
    lat: result.lat + lat / points.length,
  }), { lng: 0, lat: 0 });
  const scale = 2 ** zoom;
  const x = Math.floor(((centroid.lng + 180) / 360) * scale);
  const y = Math.floor(((1 - Math.log(Math.tan((centroid.lat * Math.PI) / 180) + 1 / Math.cos((centroid.lat * Math.PI) / 180)) / Math.PI) / 2) * scale);
  const release = HISTORICAL_RELEASES[year] || HISTORICAL_RELEASES[2026];
  return `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/${release}/${zoom}/${y}/${x}`;
};

const loadSatellitePhoto = async (geometry, year) => {
  const url = getTileUrl(geometry, year);
  if (!url) return null;
  try {
    const response = await fetch(url);
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.startsWith("image/")) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
};

const drawSatellitePhotos = (doc, photos, fromYear, toYear) => {
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#0f172a").text("Imágenes satelitales del área seleccionada", 50, 50);
  doc.font("Helvetica").fontSize(9).fillColor("#64748b").text("Teselas Esri World Imagery centradas en el polígono seleccionado.", 50, 78);
  const panels = [
    { photo: photos.from, year: fromYear, x: 50, label: "Imagen inicial" },
    { photo: photos.to, year: toYear, x: 315, label: "Imagen final" },
  ];
  for (const panel of panels) {
    doc.roundedRect(panel.x, 115, 247, 300, 8).fillAndStroke("#f8fafc", "#cbd5e1");
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#334155").text(`${panel.year} · ${panel.label}`, panel.x + 14, 132);
    if (panel.photo) {
      doc.image(panel.photo, panel.x + 14, 160, { fit: [219, 220], align: "center", valign: "center" });
    } else {
      doc.font("Helvetica").fontSize(10).fillColor("#94a3b8").text("Imagen no disponible", panel.x + 14, 270, { width: 219, align: "center" });
    }
    doc.font("Helvetica").fontSize(8).fillColor("#64748b").text("Esri World Imagery · área seleccionada", panel.x + 14, 390, { width: 219, align: "center" });
  }
};

const drawLabel = (doc, label, value, x, y, width = 240) => {
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#64748b").text(label.toUpperCase(), x, y, { width });
  doc.font("Helvetica").fontSize(11).fillColor("#0f172a").text(String(value ?? "No disponible"), x, y + 13, { width });
};

const buildPdf = async ({ parcel, comparison, expediente }) => {
  const verificationUrl = reportUrl(expediente.folio);
  const qr = await QRCode.toBuffer(verificationUrl, { errorCorrectionLevel: "M", margin: 1, width: 180 });
  const geometry = comparison.layers?.geometry || parcel.geometry;
  const coordinates = geometry?.coordinates?.[0]?.slice(0, -1) || [];
  const mapSnapshot = comparison.raw_evidence?.mapSnapshot || {};
  const displayId = mapSnapshot.id || parcel.reference_code || parcel.id;
  const displayName = mapSnapshot.propietario || parcel.name;
  const displayMunicipality = mapSnapshot.municipio || parcel.municipality || "Michoacán";
  const displayArea = mapSnapshot.superficieHa ?? parcel.area_ha;
  const displayCrop = mapSnapshot.cultivo || parcel.crop_type;
  const auditYears = comparison.layers?.auditYears || {};
  const satellitePhotos = await Promise.all([
    loadSatellitePhoto(geometry, auditYears.fromYear || 2018),
    loadSatellitePhoto(geometry, auditYears.toYear || 2026),
  ]).then(([from, to]) => ({ from, to }));
  const doc = new PDFDocument({ size: "LETTER", margin: 50, info: { Title: `Expediente ${expediente.folio}`, Author: "TerraVision" } });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.rect(0, 0, doc.page.width, 110).fill("#064e3b");
  doc.fillColor("#d1fae5").font("Helvetica-Bold").fontSize(24).text("EXPEDIENTE AMBIENTAL", 50, 34);
  doc.font("Helvetica").fontSize(11).text("Plataforma de Auditoría Ambiental · Michoacán", 52, 72);
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(18).text(expediente.folio, 50, 145);
  doc.font("Helvetica").fontSize(10).fillColor("#64748b").text(`Emisión: ${formatDate(expediente.issued_at || new Date())}`, 50, 171);
  doc.text("Referencia: Decreto de Certificación de Cero Deforestación de Michoacán", 50, 188);

  const verdictColor = expediente.verdict === "cumple" ? "#166534" : expediente.verdict === "no cumple" ? "#991b1b" : "#92400e";
  doc.roundedRect(50, 225, 512, 76, 10).fill(verdictColor);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22).text(expediente.verdict.toUpperCase(), 70, 245);
  doc.font("Helvetica").fontSize(10).text(expediente.boundary_flag ? "Caso límite: requiere atención pericial adicional." : "Veredicto automatizado con trazabilidad de fuentes.", 70, 276);

  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(14).text("Datos del predio", 50, 342);
  drawLabel(doc, "Identificador", displayId, 50, 370);
  drawLabel(doc, "Nombre / propietario", displayName, 310, 370);
  drawLabel(doc, "Municipio", displayMunicipality, 50, 420);
  drawLabel(doc, "Superficie", `${Number(displayArea || 0).toFixed(2)} ha`, 310, 420);
  drawLabel(doc, "Cultivo", displayCrop, 50, 470);
  drawLabel(doc, "Coordenadas", coordinates.map(([lng, lat]) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`).join("; "), 310, 470, 250);

  doc.addPage();
  drawSatellitePhotos(doc, satellitePhotos, auditYears.fromYear || 2018, auditYears.toYear || 2026);
  doc.font("Helvetica").fontSize(9).fillColor("#64748b").text("Las fotografías corresponden al centro del polígono seleccionado. Las coordenadas y capas ambientales se detallan en las siguientes secciones.", 50, 450, { width: 512 });

  doc.addPage();
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#0f172a").text("Resultados de la comparación", 50, 50);
  const resultRows = [
    ["Pérdida forestal", formatPercent(comparison.forest_loss_pct), `Corte base ${comparison.forest_baseline_year}`],
    ["Incendios", comparison.fire_detected === null ? "No confirmado" : comparison.fire_detected ? "Sí" : "No", `${comparison.fire_count} evento(s). Último: ${comparison.fire_last_date || "No disponible"}`],
    ["Traslape ANP", comparison.anp_overlap === null ? "No confirmado" : comparison.anp_overlap ? "Sí" : "No", `Área estimada: ${formatPercent(comparison.anp_overlap_pct)}`],
  ];
  let rowY = 95;
  for (const [label, value, detail] of resultRows) {
    doc.roundedRect(50, rowY, 512, 74, 8).fillAndStroke("#f8fafc", "#e2e8f0");
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a").text(label, 68, rowY + 15);
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#047857").text(value, 68, rowY + 35);
    doc.font("Helvetica").fontSize(9).fillColor("#64748b").text(detail, 300, rowY + 32, { width: 235 });
    rowY += 92;
  }
  const imageAudit = comparison.raw_evidence?.imageAudit;
  const auditData = imageAudit?.data;
  if (auditData) {
    doc.addPage();
    doc.font("Helvetica-Bold").fontSize(16).fillColor("#0f172a").text("Auditoría multitemporal del polígono", 50, 50);
    doc.font("Helvetica").fontSize(10).fillColor("#334155").text(
      `Comparación de imágenes ${auditData.comparativa?.ano_inicial || "N/D"} vs ${auditData.comparativa?.ano_final || "N/D"} mediante ${imageAudit.method || "auditoría satelital"}.`,
      50, 84, { width: 512 }
    );
    const auditRows = [
      ["Pérdida verde estimada", formatPercent(auditData.comparativa?.perdidaVerdePct)],
      ["Nivel de certeza", auditData.nivel_certeza === undefined ? "No disponible" : `${auditData.nivel_certeza}%`],
      ["Incendio registrado", auditData.incendio_registrado ? "Sí" : "No"],
    ];
    let auditY = 125;
    for (const [label, value] of auditRows) {
      doc.roundedRect(50, auditY, 245, 52, 7).fillAndStroke("#f8fafc", "#e2e8f0");
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#64748b").text(label.toUpperCase(), 64, auditY + 11);
      doc.font("Helvetica-Bold").fontSize(14).fillColor("#047857").text(value, 64, auditY + 28);
      auditY += 64;
    }
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a").text("Resumen pericial", 325, 125);
    doc.font("Helvetica").fontSize(10).fillColor("#334155").text(auditData.comparativa?.resumen || "No disponible", 325, 148, { width: 235, lineGap: 3 });
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a").text("Dictamen técnico", 325, 235);
    doc.font("Helvetica").fontSize(9).fillColor("#334155").text(reportText(auditData.dictamen_pericial_completo), 325, 258, { width: 235, lineGap: 3 });
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a").text("Conclusión legal", 50, 410);
    doc.font("Helvetica").fontSize(10).fillColor("#334155").text(reportText(auditData.conclusion_legal), 50, 433, { width: 512, lineGap: 3 });
  }

  doc.addPage();
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#0f172a").text("Metodología y aprobación", 50, 50);
  doc.font("Helvetica").fontSize(10).fillColor("#334155").text(
    "La plataforma confronta el polígono en WGS84 contra fuentes de observación terrestre y capas ambientales. La medición se conserva con la fecha de consulta, el estado de cada fuente y la evidencia devuelta por el proveedor.",
    50, 90, { width: 512, lineGap: 4 }
  );
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a").text("Fuentes", 50, 165);
  const sources = (comparison.sources || []).filter((source) => !["Mapa interactivo", "CONABIO"].includes(source.provider));
  sources.forEach((source, index) => doc.font("Helvetica").fontSize(10).fillColor("#334155").text(`${index + 1}. ${source.provider || "Fuente"}: ${source.status || "consultada"}`, 62, 190 + index * 18));
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a").text("Fecha de consulta", 50, 280);
  doc.font("Helvetica").fontSize(10).fillColor("#334155").text(formatDate(comparison.queried_at), 62, 302);
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#0f172a").text("Aprobación pericial simulada", 50, 350);
  doc.font("Helvetica").fontSize(10).fillColor("#334155").text(`Aprobado por: ${expediente.approved_by || "No aprobado"}`, 62, 375);
  doc.text(`Rol: ${expediente.approver_role || "No disponible"}`, 62, 392);
  doc.text(`Fecha: ${formatDate(expediente.approved_at)}`, 62, 409);
  doc.image(qr, 390, 330, { width: 140 });
  doc.font("Helvetica").fontSize(8).fillColor("#64748b").text("Escanea para verificar este folio", 390, 480, { width: 140, align: "center" });
  doc.fontSize(8).text("Este expediente es una herramienta de apoyo y no sustituye la inspección ni el dictamen oficial de la autoridad competente.", 50, 535, { width: 512, align: "center" });

  doc.end();
  return done;
};

export const getExpedienteBundle = async (folio) => {
  const expediente = await findExpediente(folio);
  if (!expediente) throw notFound("Expediente no encontrado");
  const [parcel, comparison] = await Promise.all([
    findParcelForAnalysis(expediente.parcel_id),
    findComparison(expediente.comparison_result_id),
  ]);
  if (!parcel || !comparison) throw new AppError("El expediente no tiene datos de soporte completos", 409, "EXPEDIENTE_INCOMPLETE");
  return { expediente, parcel, comparison };
};

export const generateExpedientePdf = async (folio) => {
  const bundle = await getExpedienteBundle(folio);
  if (bundle.expediente.status !== "approved") {
    if (bundle.expediente.status === "generated") return bundle;
    throw new AppError("El expediente debe ser aprobado antes de generar el PDF", 409, "EXPEDIENTE_NOT_APPROVED");
  }
  const pdf = await buildPdf(bundle);
  const sha256 = crypto.createHash("sha256").update(pdf).digest("hex");
  const expediente = await savePdf({ folio, pdf, sha256 });
  return { ...bundle, expediente, pdf, sha256 };
};
