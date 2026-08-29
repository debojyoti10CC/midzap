// Browser shim for `isomorphic-ws`: the midnight-js indexer provider imports
// `{ WebSocket }` from it, but its browser build is a bare `module.exports =
// WebSocket` (no named export). Aliased in vite.config.ts.
const WS = (globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket;
export default WS;
export { WS as WebSocket };
