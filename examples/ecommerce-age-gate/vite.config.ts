import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The `@midnight-ntwrk/*` stack is loaded lazily by LiveMidnightBackend and
// is an optional peer dependency. Install it in a real deployment
// (`npm i @midnight-ntwrk/midnight-js-contracts ...` — see docs/GO_LIVE.md);
// here it's marked external so the example still builds without it.
const midnightExternal = /^@midnight-ntwrk\//;

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  optimizeDeps: { exclude: ["@midnightzap/sdk"] },
  build: { rollupOptions: { external: [midnightExternal] } },
});
