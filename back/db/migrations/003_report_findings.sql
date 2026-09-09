alter table expedientes add column if not exists findings jsonb not null default '[]'::jsonb;
