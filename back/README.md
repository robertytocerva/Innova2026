# Innova2026 Backend

API para monitoreo de deforestacion e impacto ambiental en huertos de aguacate y berries.

## Requisitos

- Node.js 20 o superior
- Proyecto de Supabase con PostGIS habilitado
- Credenciales de Sentinel Hub para imagenes satelitales
- Credenciales opcionales de Global Forest Watch y NASA FIRMS

## Instalacion

```bash
npm install
cp .env.example .env
npm run dev
```

El servidor inicia en `http://localhost:3000`.

## Base de datos

Las migraciones estan en `supabase/migrations/`. Para aplicarlas con Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npm run migrate
```

La migracion crea tablas geoespaciales, indices PostGIS, auditoria, triggers de actualizacion y RLS. La `SUPABASE_SERVICE_ROLE_KEY` solo se usa en el backend y nunca debe exponerse al frontend.

## Endpoints principales

- `GET /health`
- `GET /api/v1/layers`
- `GET /api/v1/geocode?q=Uruapan Michoacan`
- `GET /api/v1/parcels`
- `POST /api/v1/parcels`
- `GET /api/v1/parcels/:id`
- `DELETE /api/v1/parcels/:id` (archivado logico)
- `GET /api/v1/parcels/:id/alerts`
- `POST /api/v1/parcels/:id/monitoring`
- `POST /api/v1/satellite/search`
- `GET /api/v1/alerts/deforestation`
- `GET /api/v1/alerts/fire`
- `GET /api/v1/weather`

## Limitaciones

Las alertas satelitales son indicios que requieren verificacion. La evaluacion generada por la API no sustituye una certificacion, inspeccion o dictamen oficial.
