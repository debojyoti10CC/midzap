import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// See ecommerce-age-gate/vite.config.ts for why `@midnight-ntwrk/*` is external.
const midnightExternal = /^@midnight-ntwrk\//;

export default defineConfig({
  plugins: [react()],
  server: { port: 5175 },
  optimizeDeps: { exclude: ["@midnightzap/sdk"] },
  build: { rollupOptions: { external: [midnightExternal] } },
});
