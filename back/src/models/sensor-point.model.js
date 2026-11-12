import { getClient, query } from "../config/database.js";

export const upsertSensorPoints = async ({ poligonoId, vertices }) => {
  const client = await getClient();
  let transactionStarted = false;
  try {
    await client.query("begin");
    transactionStarted = true;
    const saved = [];

    for (const point of vertices) {
      const { rows } = await client.query(
        `insert into sensor_points (
           polygon_id, device_id, node_order, source_type, status, location,
           last_seen_at, last_fix_at
         ) values (
           $1, $2, $3, $4, $5,
           case when $6::double precision is null then null
             else st_setsrid(st_makepoint($7, $6), 4326)::geometry(Point, 4326)
           end,
           case when $5 = 'offline' then null else now() end,
           case when $5 = 'active' and $6::double precision is not null then now() else null end
         )
         on conflict (polygon_id, device_id) do update set
           node_order = excluded.node_order,
           source_type = excluded.source_type,
           status = excluded.status,
           location = coalesce(excluded.location, sensor_points.location),
           last_seen_at = case
             when excluded.status = 'offline' then sensor_points.last_seen_at
             else now()
           end,
           last_fix_at = case
             when excluded.status = 'active' and excluded.location is not null then now()
             else sensor_points.last_fix_at
           end,
           updated_at = now()
         returning id, polygon_id, device_id, node_order, source_type, status,
                   st_y(location) as lat, st_x(location) as lon,
                   last_seen_at, last_fix_at, updated_at`,
        [poligonoId, point.id, point.orden, point.sourceType, point.status, point.lat, point.lon],
      );
      saved.push(rows[0]);
    }

    await client.query("commit");
    transactionStarted = false;
    return saved;
  } catch (error) {
    if (transactionStarted) {
      await client.query("rollback").catch(() => {});
    }
    throw error;
  } finally {
    client.release();
  }
};

export const listSensorPoints = async ({ polygonId }) => {
  const { rows } = await query(
    `select id, polygon_id as "polygonId", device_id as "deviceId",
            node_order as "order", source_type as "sourceType",
            case
              when status <> 'offline'
                and (last_seen_at is null or last_seen_at < now() - interval '45 seconds')
                then 'offline'
              else status
            end as status,
            st_y(location) as lat, st_x(location) as lon,
            last_seen_at as "lastSeenAt", last_fix_at as "lastFixAt",
            updated_at as "updatedAt"
     from sensor_points
     where ($1::text is null or polygon_id = $1)
     order by polygon_id, node_order, device_id`,
    [polygonId || null],
  );
  return rows;
};
