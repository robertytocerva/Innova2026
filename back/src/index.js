import app from "./app.js";
import { config } from "./config/index.js";

const server = app.listen(config.PORT, () => {
  console.log(`Innova2026 API escuchando en http://localhost:${config.PORT}`);
});

const shutdown = (signal) => {
  console.log(`${signal}: cerrando servidor`);
  server.close(() => process.exit(0));
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
