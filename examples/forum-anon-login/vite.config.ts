import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// NOTE: the @midnight-ntwrk browser stack (WASM onchain-runtime + top-level
// await + node builtins + a WebSocket shim) does not bundle in a stock Vite
// setup. It is marked external here so this repo builds; a real deployment
// needs Midnight's example-dApp Vite config (vite-plugin-wasm +
// vite-plugin-top-level-await + vite-plugin-node-polyfills + a
// resolve.alias for isomorphic-ws). See the @midzap/sdk README.
const midnightExternal = /^@midnight-?ntwrk\//;

export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
  optimizeDeps: { exclude: ["@midzap/sdk"] },
  build: { rollupOptions: { external: [midnightExternal] } },
});
