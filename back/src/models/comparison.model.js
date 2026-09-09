import { query } from "../config/database.js";
import { AppError } from "../utils/errors.js";

const parseJson = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
};

const normalizeResult = (row) => row && ({
  ...row,
  sources: parseJson(row.sources, []),
  layers: parseJson(row.layers, {}),
  raw_evidence: parseJson(row.raw_evidence, {}),
});

export const createComparisonResult = async ({
  parcelId,
  forestLossPct,
  forestBaselineYear = 2018,
  forestCutoffDate,
  forestStatus = "unknown",
  fireDetected,
  fireCount = 0,
  fireLastDate = null,
  fireStatus = "unknown",
  anpOverlap,
  anpOverlapPct = null,
  anpStatus = "unknown",
  sources = [],
  layers = {},
  rawEvidence = {},
}) => {
  try {
    const { rows } = await query(
      `insert into comparison_results
       (parcel_id, forest_loss_pct, forest_baseline_year, forest_cutoff_date, forest_status,
        fire_detected, fire_count, fire_last_date, fire_status, anp_overlap, anp_overlap_pct,
        anp_status, sources, layers, raw_evidence)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       returning *`,
      [
        parcelId,
        forestLossPct,
        forestBaselineYear,
        forestCutoffDate,
        forestStatus,
        fireDetected,
        fireCount,
        fireLastDate,
        fireStatus,
        anpOverlap,
        anpOverlapPct,
        anpStatus,
        JSON.stringify(sources),
        JSON.stringify(layers),
        JSON.stringify(rawEvidence),
      ]
    );
    return normalizeResult(rows[0]);
  } catch (err) {
    throw new AppError(err.message, 400, "DATABASE_ERROR");
  }
};

export const findComparison = async (id) => {
  const { rows } = await query("select * from comparison_results where id = $1", [id]);
  return normalizeResult(rows[0]);
};

export const listParcelComparisons = async (parcelId) => {
  const { rows } = await query(
    "select * from comparison_results where parcel_id = $1 order by queried_at desc",
    [parcelId]
  );
  return rows.map(normalizeResult);
};
