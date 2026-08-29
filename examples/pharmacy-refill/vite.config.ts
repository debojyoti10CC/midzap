import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// Bundling the @midnight-ntwrk live stack in a browser needs: WASM support
// (the onchain-runtime is wasm-bindgen), Node builtin shims, a real
// `WebSocket` for `isomorphic-ws`, and the WASM packages kept out of the
// esbuild dep pre-bundler. `esnext` targets give native top-level await, so
// the flaky vite-plugin-top-level-await isn't needed.
export default defineConfig({
  plugins: [wasm(), nodePolyfills(), react()],
  server: { port: 5175 },
  resolve: {
    alias: {
      "isomorphic-ws": fileURLToPath(new URL("./src/ws-shim.ts", import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: [
      "@midzap/sdk",
      "@midnight-ntwrk/compact-runtime",
      "@midnightntwrk/onchain-runtime-v4",
      "@midnight-ntwrk/midnight-js-contracts",
      "@midnight-ntwrk/midnight-js-types",
      "@midnight-ntwrk/midnight-js-level-private-state-provider",
      "@midnight-ntwrk/midnight-js-indexer-public-data-provider",
      "@midnight-ntwrk/midnight-js-http-client-proof-provider",
      "@midnight-ntwrk/midnight-js-fetch-zk-config-provider",
      "@midnight-ntwrk/dapp-connector-api",
    ],
  },
  build: { target: "esnext" },
  esbuild: { target: "esnext" },
});
