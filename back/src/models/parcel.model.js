import { query } from "../config/database.js";
import { AppError } from "../utils/errors.js";

export const listParcels = async ({ limit = 20, offset = 0, status = "active" }) => {
  const [dataResult, countResult] = await Promise.all([
    query("select * from parcels where status = $1 order by created_at desc limit $2 offset $3", [status, limit, offset]),
    query("select count(*)::int as total from parcels where status = $1", [status]),
  ]);
  return { data: dataResult.rows, count: countResult.rows[0].total };
};

export const findParcel = async (id) => {
  const { rows } = await query("select * from parcels where id = $1", [id]);
  return rows[0] || null;
};

export const createParcel = async ({ name, cropType, municipality, state, geometry, metadata = {} }) => {
  const geoJson = JSON.stringify(geometry);
  try {
    const { rows } = await query(
      `insert into parcels (name, crop_type, municipality, state, geometry, metadata)
       values ($1, $2, $3, $4, st_setsrid(st_geomfromgeojson($5), 4326), $6)
       returning *`,
      [name, cropType, municipality, state || "Michoacan", geoJson, JSON.stringify(metadata)]
    );
    return rows[0];
  } catch (err) {
    throw new AppError(err.message, 400, "DATABASE_ERROR");
  }
};

export const archiveParcel = async (id) => {
  const { rows } = await query(
    "update parcels set status = 'archived' where id = $1 returning *",
    [id]
  );
  if (!rows[0]) throw new AppError("Parcela no encontrada", 404, "NOT_FOUND");
  return rows[0];
};
