import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.preprocess((value) => value || undefined, z.string().min(1, "DATABASE_URL es requerido")),
  SENTINEL_HUB_CLIENT_ID: z.preprocess((value) => value || undefined, z.string().optional()),
  SENTINEL_HUB_CLIENT_SECRET: z.preprocess((value) => value || undefined, z.string().optional()),
  SENTINEL_HUB_BASE_URL: z.string().url().default("https://services.sentinel-hub.com"),
  GFW_API_TOKEN: z.preprocess((value) => value || undefined, z.string().optional()),
  FIRMS_MAP_KEY: z.preprocess((value) => value || undefined, z.string().optional()),
  OPEN_METEO_BASE_URL: z.string().url().default("https://api.open-meteo.com/v1"),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Configuracion invalida: ${parsed.error.message}`);
}

export const config = parsed.data;
export const hasDatabase = Boolean(config.DATABASE_URL);
