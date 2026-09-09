import { query } from "../config/database.js";
import { AppError } from "../utils/errors.js";

const parseJson = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
};

const normalize = (row) => row && ({
  ...row,
  reasons: parseJson(row.reasons, []),
  findings: parseJson(row.findings, []),
  pdf: undefined,
});

export const createExpediente = async ({ parcelId, comparisonResultId, verdict, boundaryFlag, reasons, findings }) => {
  const year = new Date().getUTCFullYear();
  const suffix = `${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
  const folio = `EXP-${year}-${suffix}`;

  try {
    const { rows } = await query(
      `insert into expedientes (folio, parcel_id, comparison_result_id, verdict, boundary_flag, reasons, findings)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id, folio, parcel_id, comparison_result_id, verdict, boundary_flag, reasons,
                 findings, status, approved_by, approver_role, approved_at, pdf_sha256, generated_at,
                 issued_at, created_at, updated_at`,
      [folio, parcelId, comparisonResultId, verdict, boundaryFlag, JSON.stringify(reasons), JSON.stringify(findings || [])]
    );
    return normalize(rows[0]);
  } catch (err) {
    throw new AppError(err.message, 400, "DATABASE_ERROR");
  }
};

export const findExpediente = async (folio, { includePdf = false } = {}) => {
  const columns = includePdf ? "*" : `id, folio, parcel_id, comparison_result_id, verdict, boundary_flag,
    reasons, findings, status, approved_by, approver_role, approved_at, pdf_sha256, generated_at, issued_at,
    created_at, updated_at`;
  const { rows } = await query(`select ${columns} from expedientes where folio = $1`, [folio]);
  return normalize(rows[0]);
};

export const listExpedientes = async () => {
  const { rows } = await query(
    `select e.id, e.folio, e.parcel_id, e.comparison_result_id, e.verdict, e.boundary_flag,
            e.reasons, e.findings, e.status, e.approved_by, e.approver_role, e.approved_at, e.pdf_sha256,
            e.generated_at, e.issued_at, e.created_at, e.updated_at,
            coalesce(cr.raw_evidence->'mapSnapshot'->>'referenceCode', p.reference_code) as reference_code,
            coalesce(cr.raw_evidence->'mapSnapshot'->>'propietario', p.name) as name,
            coalesce(cr.raw_evidence->'mapSnapshot'->>'cultivo', p.crop_type) as crop_type,
            coalesce(cr.raw_evidence->'mapSnapshot'->>'municipio', p.municipality) as municipality,
            coalesce((cr.raw_evidence->'mapSnapshot'->>'superficieHa')::numeric, p.area_ha) as area_ha,
            (cr.raw_evidence->'imageAudit'->'data'->'comparativa'->>'ano_inicial')::int as audit_from_year,
            (cr.raw_evidence->'imageAudit'->'data'->'comparativa'->>'ano_final')::int as audit_to_year,
            (cr.raw_evidence->'imageAudit'->'data'->'nivel_certeza')::numeric as audit_confidence
     from expedientes e
     join parcels p on p.id = e.parcel_id
     join comparison_results cr on cr.id = e.comparison_result_id
     order by e.created_at desc`
  );
  return rows.map(normalize);
};

export const approveExpediente = async ({ folio, approvedBy, role }) => {
  const { rows } = await query(
    `update expedientes
     set approved_by = $2, approver_role = $3, approved_at = now(), status = 'approved'
     where folio = $1 and status = 'draft'
     returning id, folio, parcel_id, comparison_result_id, verdict, boundary_flag, reasons, findings,
               status, approved_by, approver_role, approved_at, pdf_sha256, generated_at,
               issued_at, created_at, updated_at`,
    [folio, approvedBy, role]
  );
  if (!rows[0]) throw new AppError("El expediente no existe o ya fue aprobado", 409, "EXPEDIENTE_NOT_PENDING");
  return normalize(rows[0]);
};

export const savePdf = async ({ folio, pdf, sha256 }) => {
  const { rows } = await query(
    `update expedientes
     set pdf = $2, pdf_sha256 = $3, generated_at = now(), issued_at = now(), status = 'generated'
     where folio = $1 and status = 'approved'
     returning id, folio, parcel_id, comparison_result_id, verdict, boundary_flag, reasons, findings,
               status, approved_by, approver_role, approved_at, pdf_sha256, generated_at,
               issued_at, created_at, updated_at`,
    [folio, pdf, sha256]
  );
  if (!rows[0]) throw new AppError("El expediente debe estar aprobado antes de generar el PDF", 409, "EXPEDIENTE_NOT_APPROVED");
  return normalize(rows[0]);
};

export const findPdf = async (folio) => {
  const { rows } = await query(
    "select folio, verdict, pdf, pdf_sha256 from expedientes where folio = $1 and pdf is not null",
    [folio]
  );
  return rows[0] || null;
};

export const deleteExpediente = async (folio) => {
  const { rows } = await query(
    `delete from expedientes where folio = $1
     returning id, folio`,
    [folio]
  );
  if (!rows[0]) throw new AppError("Expediente no encontrado", 404, "EXPEDIENTE_NOT_FOUND");
  return rows[0];
};
