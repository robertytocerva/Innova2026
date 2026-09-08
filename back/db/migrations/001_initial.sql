create extension if not exists postgis;

create table parcels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  crop_type text not null check (crop_type in ('avocado', 'berries', 'other')),
  municipality text,
  state text not null default 'Michoacan',
  area_ha numeric(14, 4),
  geometry geometry(Polygon, 4326) not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table monitoring_sessions (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references parcels(id) on delete cascade,
  from_date date not null,
  to_date date not null,
  cloud_cover_max numeric(5, 2) check (cloud_cover_max between 0 and 100),
  status text not null default 'created' check (status in ('created', 'running', 'completed', 'failed')),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (to_date >= from_date)
);

create table satellite_observations (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid references parcels(id) on delete cascade,
  session_id uuid references monitoring_sessions(id) on delete set null,
  provider text not null,
  external_id text,
  captured_at timestamptz not null,
  cloud_cover numeric(5, 2),
  image_url text,
  thumbnail_url text,
  indices jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table deforestation_alerts (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid references parcels(id) on delete cascade,
  provider text not null,
  external_id text,
  detected_at timestamptz not null,
  confidence text,
  area_ha numeric(14, 4),
  geometry geometry(Geometry, 4326) not null,
  source_url text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table fire_alerts (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid references parcels(id) on delete cascade,
  provider text not null default 'nasa-firms',
  external_id text,
  detected_at timestamptz not null,
  confidence numeric(5, 2),
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table environmental_assessments (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references parcels(id) on delete cascade,
  session_id uuid references monitoring_sessions(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'in_review', 'completed', 'insufficient_data')),
  risk_level text not null default 'unknown' check (risk_level in ('low', 'moderate', 'high', 'unknown')),
  score numeric(5, 2) check (score between 0 and 100),
  factors jsonb not null default '{}'::jsonb,
  methodology_version text not null default '2026.1',
  limitations text[] not null default array[]::text[],
  assessed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table evidence_records (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid references parcels(id) on delete cascade,
  assessment_id uuid references environmental_assessments(id) on delete set null,
  evidence_type text not null,
  source text not null,
  source_url text,
  captured_at timestamptz,
  snapshot_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_parcels_geometry on parcels using gist (geometry);
create index idx_parcels_state_municipality on parcels (state, municipality);
create index idx_satellite_obs_parcel_date on satellite_observations (parcel_id, captured_at desc);
create index idx_deforestation_geometry on deforestation_alerts using gist (geometry);
create index idx_deforestation_parcel_date on deforestation_alerts (parcel_id, detected_at desc);
create index idx_fire_parcel_date on fire_alerts (parcel_id, detected_at desc);
create index idx_assessments_parcel_date on environmental_assessments (parcel_id, created_at desc);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_parcels_updated_at
  before update on parcels for each row execute function set_updated_at();

create trigger trg_assessments_updated_at
  before update on environmental_assessments for each row execute function set_updated_at();
