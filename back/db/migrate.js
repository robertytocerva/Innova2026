import "dotenv/config";
import pg from "pg";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const MIGRATIONS_DIR = join(import.meta.dirname, "migrations");

const run = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL no esta configurada en .env");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
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
        console.log(`  omitida: ${file}`);
        continue;
      }
      const sql = await readFile(join(MIGRATIONS_DIR, file), "utf-8");
      console.log(`  aplicando: ${file}`);
      await client.query(sql);
      await client.query("insert into _migrations (name) values ($1)", [file]);
      applied++;
    }

    console.log(`Migracion completa. ${applied} archivo(s) aplicado(s).`);
  } finally {
    await client.end();
  }
};

run().catch((err) => {
  console.error("Error en migracion:", err.message);
  process.exit(1);
});
