import { query } from "../config/database.js";
import { AppError } from "../utils/errors.js";

export const listParcels = async ({ limit = 20, offset = 0, status = "active" }) => {
  const [dataResult, countResult] = await Promise.all([
    query(
      `select id, reference_code, name, crop_type, municipality, state, area_ha,
              st_asgeojson(geometry)::json as geojson, status, metadata, created_at, updated_at
       from parcels where status = $1 order by created_at desc limit $2 offset $3`,
      [status, limit, offset]
    ),
    query("select count(*)::int as total from parcels where status = $1", [status]),
  ]);
  return { data: dataResult.rows, count: countResult.rows[0].total };
};

export const findParcel = async (id) => {
  const { rows } = await query("select *, ST_AsGeoJSON(geometry)::json as geojson from parcels where id = $1", [id]);
  return rows[0] || null;
};

export const findParcelForAnalysis = async (id) => {
  const { rows } = await query(
    `select id, reference_code, name, crop_type, municipality, state, area_ha,
            st_asgeojson(geometry)::json as geometry, metadata, created_at, updated_at
     from parcels where id = $1`,
    [id]
  );
  return rows[0] || null;
};

export const createParcel = async ({ referenceCode = null, name, cropType, municipality, state, geometry, metadata = {} }) => {
  const geoJson = JSON.stringify(geometry);
  referenceCode = referenceCode || metadata.referenceCode || metadata.reference_code || null;
  try {
    const { rows } = await query(
      `insert into parcels (reference_code, name, crop_type, municipality, state, area_ha, geometry, metadata)
       values ($1, $2, $3, $4, $5, st_area(st_transform(st_setsrid(st_geomfromgeojson($6), 4326), 6933)) / 10000,
         st_setsrid(st_geomfromgeojson($6), 4326), $7)
       returning *, ST_AsGeoJSON(geometry)::json as geojson`,
      [referenceCode, name, cropType, municipality, state || "Michoacan", geoJson, JSON.stringify(metadata)]
    );
    return rows[0];
  } catch (err) {
    throw new AppError(err.message, 400, "DATABASE_ERROR");
  }
};

export const findParcelByReferenceCode = async (referenceCode) => {
  const { rows } = await query("select * from parcels where reference_code = $1", [referenceCode]);
  return rows[0] || null;
};

export const updateParcelMetadata = async (id, metadata) => {
  const { rows } = await query(
    "update parcels set metadata = metadata || $2::jsonb where id = $1 returning *",
    [id, JSON.stringify(metadata)]
  );
  return rows[0] || null;
};

export const archiveParcel = async (id) => {
  const { rows } = await query(
    "update parcels set status = 'archived' where id = $1 returning *",
    [id]
  );
  if (!rows[0]) throw new AppError("Parcela no encontrada", 404, "NOT_FOUND");
  return rows[0];
};
