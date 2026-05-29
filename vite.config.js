import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  server: {
    host: "127.0.0.1",
    port: 4173,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        heizungWaermepumpen: resolve(__dirname, "heizung-waermepumpen.html"),
        gebaeudetechnik: resolve(__dirname, "gebaeudetechnik.html"),
        instandhaltung: resolve(__dirname, "instandhaltung.html"),
        kontakt: resolve(__dirname, "kontakt.html"),
      },
    },
  },
});
