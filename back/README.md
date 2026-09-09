# Innova2026 Backend

API para monitoreo de deforestacion e impacto ambiental en huertos de aguacate y berries.

## Requisitos

- Node.js 20 o superior
- Cuenta en Neon (PostgreSQL con PostGIS)
- Credenciales de Sentinel Hub para imagenes satelitales
- Credenciales opcionales de Global Forest Watch y NASA FIRMS

## Instalacion

```bash
npm install
cp .env.example .env
# Configurar DATABASE_URL en .env con tu string de conexion de Neon
npm run dev
```

El servidor inicia en `http://localhost:3000`.

## Base de datos

Las migraciones estan en `db/migrations/`. Para aplicarlas:

```bash
npm run migrate
```

El script crea la tabla `_migrations` para rastrear que archivos ya se ejecutaron. Las migraciones se aplican en orden alfabetico.

### Tablas creadas

- `parcels` - Parcelas/huertos con geometria PostGIS
- `monitoring_sessions` - Sesiones de monitoreo satelital
- `satellite_observations` - Imagenes satelitales consultadas
- `deforestation_alerts` - Alertas de deforestacion (GLAD, RADD)
- `fire_alerts` - Alertas de incendios (NASA FIRMS)
- `environmental_assessments` - Evaluaciones de riesgo ambiental
- `evidence_records` - Registros de evidencia
- `comparison_results` - Resultado trazable de pérdida forestal, incendios y ANP
- `expedientes` - Folio, veredicto, aprobación y PDF verificable

## Endpoints

### Publicos

- `GET /health` - Estado del servicio
- `GET /api/v1/layers` - Capas ambientales disponibles
- `GET /api/v1/geocode?q=Uruapan` - Geocodificacion
- `POST /api/v1/satellite/search` - Buscar imagenes Sentinel-2
- `GET /api/v1/alerts/deforestation` - Alertas GFW por bbox
- `GET /api/v1/alerts/fire` - Incendios FIRMS por bbox
- `GET /api/v1/weather` - Clima historico

### Requieren base de datos

- `GET /api/v1/parcels` - Listar parcelas
- `POST /api/v1/parcels` - Crear parcela
- `GET /api/v1/parcels/:id` - Obtener parcela
- `DELETE /api/v1/parcels/:id` - Archivar parcela
- `GET /api/v1/parcels/:id/alerts` - Alertas de una parcela
- `POST /api/v1/parcels/:id/monitoring` - Ejecutar monitoreo
- `GET /api/v1/huertas` - Listar huertas registradas
- `POST /api/v1/huertas` - Registrar una huerta con Polygon GeoJSON
- `POST /api/v1/seed` - Cargar las cinco huertas de referencia de forma idempotente
- `POST /api/v1/huertas/:id/comparaciones` - Confrontar una huerta y crear expediente
- `POST /api/v1/huertas/reference/:referenceCode/auditoria-reporte` - Adjuntar la auditoría multitemporal del mapa y crear expediente
- `GET /api/v1/huertas/:id/comparaciones` - Historial de comparaciones
- `GET /api/v1/expedientes` - Listar expedientes
- `GET /api/v1/expedientes/:folio` - Consultar un expediente
- `POST /api/v1/expedientes/:folio/aprobar` - Registrar aprobación pericial simulada
- `POST /api/v1/expedientes/:folio/generar-pdf` - Generar el documento PDF
- `GET /api/v1/expedientes/:folio/pdf` - Descargar el PDF
- `GET /api/v1/public/verificacion/:folio` - Verificación pública para QR

### Configuración de reportes

Los umbrales iniciales son configurables con `FOREST_LOSS_MAX_PERCENT`, `FOREST_LOSS_EDGE_BAND` y `ANP_EDGE_BAND`. `REPORT_DEMO_MODE=true` permite probar las cinco huertas seed con resultados controlados; debe permanecer en `false` en producción. Si no se configura `ANP_GEOJSON_URL`, GFW, FIRMS o una fuente cuantitativa de pérdida forestal, el motor conserva el resultado como `unknown` y emite `requiere revision`.

## Limitaciones

Las alertas satelitales son indicios que requieren verificacion. La evaluacion generada por la API no sustituye una certificacion, inspeccion o dictamen oficial.
