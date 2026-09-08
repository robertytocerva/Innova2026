import "dotenv/config";
import app from "./app.js";
import { config } from "./config/index.js";
import { runMigrations } from "../db/migrate.js";

const start = async () => {
  try {
    console.log("Ejecutando migraciones...");
    const { applied, total } = await runMigrations({ silent: false });
    console.log(`Migraciones: ${applied} aplicada(s) de ${total} total.`);
  } catch (err) {
    console.error("No se pudieron aplicar las migraciones:", err.message);
    process.exit(1);
  }

  const server = app.listen(config.PORT, () => {
    console.log(`Innova2026 API escuchando en http://localhost:${config.PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal}: cerrando servidor`);
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start();
