create extension if not exists pgcrypto;
create extension if not exists postgis;

create type public.parcel_status as enum ('active', 'archived');
create type public.assessment_status as enum ('pending', 'in_review', 'completed', 'insufficient_data');
create type public.risk_level as enum ('low', 'moderate', 'high', 'unknown');
create type public.report_status as enum ('pending', 'reviewing', 'verified', 'rejected');

create table public.parcels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  crop_type text not null check (crop_type in ('avocado', 'berries', 'other')),
  municipality text,
  state text not null default 'Michoacan',
  area_ha numeric(14, 4),
  geometry geography(Polygon, 4326) not null,
  status public.parcel_status not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.monitoring_sessions (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references public.parcels(id) on delete cascade,
  from_date date not null,
  to_date date not null,
  cloud_cover_max numeric(5, 2) check (cloud_cover_max between 0 and 100),
  status text not null default 'created' check (status in ('created', 'running', 'completed', 'failed')),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (to_date >= from_date)
);

create table public.satellite_observations (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid references public.parcels(id) on delete cascade,
  session_id uuid references public.monitoring_sessions(id) on delete set null,
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

create table public.deforestation_alerts (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid references public.parcels(id) on delete cascade,
  provider text not null,
  external_id text,
  detected_at timestamptz not null,
  confidence text,
  area_ha numeric(14, 4),
  geometry geography(Geometry, 4326) not null,
  source_url text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table public.fire_alerts (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid references public.parcels(id) on delete cascade,
  provider text not null default 'nasa-firms',
  external_id text,
  detected_at timestamptz not null,
  confidence numeric(5, 2),
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  geometry geography(Point, 4326) generated always as
    (st_setsrid(st_makepoint(longitude, latitude), 4326)::geography) stored,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table public.environmental_assessments (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references public.parcels(id) on delete cascade,
  session_id uuid references public.monitoring_sessions(id) on delete set null,
  status public.assessment_status not null default 'pending',
  risk_level public.risk_level not null default 'unknown',
  score numeric(5, 2) check (score between 0 and 100),
  factors jsonb not null default '{}'::jsonb,
  methodology_version text not null default '2026.1',
  limitations text[] not null default array[]::text[],
  assessed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence_records (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid references public.parcels(id) on delete cascade,
  assessment_id uuid references public.environmental_assessments(id) on delete set null,
  evidence_type text not null,
  source text not null,
  source_url text,
  captured_at timestamptz,
  snapshot_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.citizen_reports (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid references public.parcels(id) on delete set null,
  report_type text not null,
  description text not null check (char_length(description) between 10 and 5000),
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  photo_urls text[] not null default array[]::text[],
  status public.report_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index parcels_geometry_gix on public.parcels using gist (geometry);
create index parcels_state_municipality_idx on public.parcels (state, municipality);
create index satellite_observations_parcel_date_idx on public.satellite_observations (parcel_id, captured_at desc);
create index deforestation_alerts_geometry_gix on public.deforestation_alerts using gist (geometry);
create index deforestation_alerts_parcel_date_idx on public.deforestation_alerts (parcel_id, detected_at desc);
create index fire_alerts_geometry_gix on public.fire_alerts using gist (geometry);
create index fire_alerts_parcel_date_idx on public.fire_alerts (parcel_id, detected_at desc);
create index environmental_assessments_parcel_date_idx on public.environmental_assessments (parcel_id, created_at desc);
create index citizen_reports_geometry_gix on public.citizen_reports using gist
  (st_setsrid(st_makepoint(longitude, latitude), 4326)::geography);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger parcels_set_updated_at before update on public.parcels
for each row execute function public.set_updated_at();
create trigger assessments_set_updated_at before update on public.environmental_assessments
for each row execute function public.set_updated_at();
create trigger reports_set_updated_at before update on public.citizen_reports
for each row execute function public.set_updated_at();

alter table public.parcels enable row level security;
alter table public.monitoring_sessions enable row level security;
alter table public.satellite_observations enable row level security;
alter table public.deforestation_alerts enable row level security;
alter table public.fire_alerts enable row level security;
alter table public.environmental_assessments enable row level security;
alter table public.evidence_records enable row level security;
alter table public.citizen_reports enable row level security;
alter table public.audit_log enable row level security;

-- El backend usa la service role key y aplica autorizacion en sus propias rutas.
-- No se habilita acceso anonimo directo a las tablas.
