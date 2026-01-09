import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const BACKEND = "http://201.144.124.57:5400/crmcoredev";
const MT_BACKEND = "http://localhost:5078";

export default defineConfig({
  plugins: [svelte()],
  server: {
    proxy: {
      "/api": {
        target: BACKEND,
        changeOrigin: true,
        secure: false,
      },
      // Proxy para el backend de MasterTrack (.NET)
      "/mt-api": {
        target: MT_BACKEND,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/mt-api/, ""),
      },
    },
  },
});
