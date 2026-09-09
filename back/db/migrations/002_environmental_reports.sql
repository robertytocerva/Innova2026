alter table parcels add column if not exists reference_code text;
create unique index if not exists idx_parcels_reference_code on parcels (reference_code) where reference_code is not null;

create table if not exists comparison_results (
  id uuid primary key default gen_random_uuid(),
  parcel_id uuid not null references parcels(id) on delete cascade,
  forest_loss_pct numeric(8, 4),
  forest_baseline_year integer not null default 2018,
  forest_cutoff_date date not null,
  forest_status text not null default 'unknown' check (forest_status in ('pass', 'fail', 'review', 'unknown')),
  fire_detected boolean,
  fire_count integer not null default 0,
  fire_last_date date,
  fire_status text not null default 'unknown' check (fire_status in ('pass', 'fail', 'review', 'unknown')),
  anp_overlap boolean,
  anp_overlap_pct numeric(8, 4),
  anp_status text not null default 'unknown' check (anp_status in ('pass', 'fail', 'review', 'unknown')),
  queried_at timestamptz not null default now(),
  sources jsonb not null default '[]'::jsonb,
  layers jsonb not null default '{}'::jsonb,
  raw_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists expedientes (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  parcel_id uuid not null references parcels(id) on delete restrict,
  comparison_result_id uuid not null references comparison_results(id) on delete restrict,
  verdict text not null check (verdict in ('cumple', 'no cumple', 'requiere revision')),
  boundary_flag boolean not null default false,
  reasons jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'approved', 'generated')),
  approved_by text,
  approver_role text,
  approved_at timestamptz,
  pdf bytea,
  pdf_sha256 text,
  generated_at timestamptz,
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((approved_by is null and approved_at is null) or (approved_by is not null and approved_at is not null)),
  check ((status = 'draft' and pdf is null) or status in ('approved', 'generated'))
);

create index if not exists idx_comparison_results_parcel_date
  on comparison_results (parcel_id, queried_at desc);
create index if not exists idx_expedientes_parcel_date
  on expedientes (parcel_id, created_at desc);
create index if not exists idx_expedientes_status
  on expedientes (status, created_at desc);

drop trigger if exists trg_expedientes_updated_at on expedientes;
create trigger trg_expedientes_updated_at
  before update on expedientes for each row execute function set_updated_at();
