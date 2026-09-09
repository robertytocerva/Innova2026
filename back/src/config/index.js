import "dotenv/config";
import { z } from "zod";

const booleanEnv = z.preprocess(
  (value) => value === undefined ? undefined : value === true || value === "true" || value === "1",
  z.boolean().default(false)
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.preprocess((value) => value || undefined, z.string().min(1, "DATABASE_URL es requerido")),
  SENTINEL_HUB_CLIENT_ID: z.preprocess((value) => value || undefined, z.string().optional()),
  SENTINEL_HUB_CLIENT_SECRET: z.preprocess((value) => value || undefined, z.string().optional()),
  SENTINEL_HUB_BASE_URL: z.string().url().default("https://services.sentinel-hub.com"),
  GFW_API_TOKEN: z.preprocess((value) => value || undefined, z.string().optional()),
  FIRMS_MAP_KEY: z.preprocess((value) => value || undefined, z.string().optional()),
  GEMINI_API_KEY: z.preprocess((value) => value || undefined, z.string().optional()),
  GEMINI_MODEL: z.string().default("gemini-3.5-flash"),
  OPEN_METEO_BASE_URL: z.string().url().default("https://api.open-meteo.com/v1"),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
  FOREST_LOSS_MAX_PERCENT: z.coerce.number().min(0).max(100).default(1),
  FOREST_LOSS_EDGE_BAND: z.coerce.number().min(0).max(100).default(0.25),
  ANP_EDGE_BAND: z.coerce.number().min(0).max(100).default(0.25),
  REPORT_DEMO_MODE: booleanEnv,
  PUBLIC_VERIFICATION_URL: z.string().url().default("http://localhost:4321/verificar"),
  ANP_GEOJSON_URL: z.preprocess((value) => value || undefined, z.string().url().optional()),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Configuracion invalida: ${parsed.error.message}`);
}

export const config = parsed.data;
export const hasDatabase = Boolean(config.DATABASE_URL);
