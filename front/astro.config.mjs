// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

export default defineConfig({
  prefetch: true,
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
