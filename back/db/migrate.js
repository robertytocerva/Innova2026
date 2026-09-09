import "dotenv/config";
import pg from "pg";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const MIGRATIONS_DIR = join(import.meta.dirname, "migrations");

const cleanConnectionString = (url) => {
  try {
    const u = new URL(url);
    u.searchParams.delete("channel_binding");
    return u.toString();
  } catch {
    return url;
  }
};

export const runMigrations = async ({ silent = false } = {}) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no esta configurada en .env");
  }

  const client = new pg.Client({
    connectionString: cleanConnectionString(connectionString),
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    await client.query(`
      create table if not exists _migrations (
        id serial primary key,
        name text not null unique,
        executed_at timestamptz not null default now()
      );
    `);

    const { rows: executed } = await client.query("select name from _migrations order by id");
    const executedNames = new Set(executed.map((r) => r.name));

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let applied = 0;
    for (const file of files) {
      if (executedNames.has(file)) {
        if (!silent) console.log(`  omitida: ${file}`);
        continue;
      }
      const sql = await readFile(join(MIGRATIONS_DIR, file), "utf-8");
      if (!silent) console.log(`  aplicando: ${file}`);
      await client.query(sql);
      await client.query("insert into _migrations (name) values ($1)", [file]);
      applied++;
    }

    if (!silent) console.log(`Migracion completa. ${applied} archivo(s) aplicado(s).`);
    return { applied, total: files.length };
  } finally {
    await client.end();
  }
};

const isMain = () => {
  try {
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  } catch {
    return false;
  }
};

if (isMain()) {
  runMigrations().catch((err) => {
    console.error("Error en migracion:", err.message);
    process.exit(1);
  });
}
