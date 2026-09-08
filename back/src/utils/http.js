import axios from "axios";
import { config } from "../config/index.js";

export const http = axios.create({
  timeout: config.REQUEST_TIMEOUT_MS,
  headers: { Accept: "application/json", "User-Agent": "Innova2026-Environmental-Monitor/1.0" }
});
