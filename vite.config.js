import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const BACKEND = "http://201.144.124.57:5400/crmcoredev";

export default defineConfig({
  plugins: [svelte()],
  server: {
    proxy: {
      "/api": {
        target: BACKEND,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
