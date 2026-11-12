create table if not exists sensor_points (
  id uuid primary key default gen_random_uuid(),
  polygon_id text not null,
  device_id text not null,
  node_order smallint not null check (node_order between 1 and 255),
  source_type text not null default 'physical' check (source_type in ('physical', 'digital')),
  status text not null default 'offline' check (status in ('active', 'no_fix', 'offline')),
  location geometry(Point, 4326),
  last_seen_at timestamptz,
  last_fix_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (polygon_id, device_id),
  check (status <> 'active' or location is not null)
);

create index if not exists idx_sensor_points_location
  on sensor_points using gist (location);
create index if not exists idx_sensor_points_polygon_order
  on sensor_points (polygon_id, node_order);
create index if not exists idx_sensor_points_seen
  on sensor_points (last_seen_at desc);

drop trigger if exists trg_sensor_points_updated_at on sensor_points;
create trigger trg_sensor_points_updated_at
  before update on sensor_points for each row execute function set_updated_at();
