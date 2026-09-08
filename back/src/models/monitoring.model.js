import { query } from "../config/database.js";
import { AppError } from "../utils/errors.js";

export const createSession = async ({ parcelId, fromDate, toDate, cloudCoverMax }) => {
  try {
    const { rows } = await query(
      `insert into monitoring_sessions (parcel_id, from_date, to_date, cloud_cover_max, status)
       values ($1, $2, $3, $4, 'running')
       returning *`,
      [parcelId, fromDate, toDate, cloudCoverMax]
    );
    return rows[0];
  } catch (err) {
    throw new AppError(err.message, 400, "DATABASE_ERROR");
  }
};

export const saveAssessment = async ({ parcelId, sessionId, status, riskLevel, score, factors, limitations, assessedAt }) => {
  try {
    const { rows } = await query(
      `insert into environmental_assessments (parcel_id, session_id, status, risk_level, score, factors, limitations, assessed_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning *`,
      [parcelId, sessionId, status, riskLevel, score, JSON.stringify(factors), limitations, assessedAt]
    );
    return rows[0];
  } catch (err) {
    throw new AppError(err.message, 400, "DATABASE_ERROR");
  }
};

export const listParcelAlerts = async (parcelId) => {
  const [forest, fire, assessments] = await Promise.all([
    query("select * from deforestation_alerts where parcel_id = $1 order by detected_at desc", [parcelId]),
    query("select * from fire_alerts where parcel_id = $1 order by detected_at desc", [parcelId]),
    query("select * from environmental_assessments where parcel_id = $1 order by created_at desc", [parcelId]),
  ]);
  return {
    deforestationAlerts: forest.rows,
    fireAlerts: fire.rows,
    assessments: assessments.rows,
  };
};
