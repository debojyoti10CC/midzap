/**
 * Ambient shims for the Midnight JS stack.
 *
 * These packages are optional peer dependencies: the SDK compiles and
 * ships without them, and a consuming app installs the ones it needs when
 * it wires `LiveMidnightBackend`. The exact type surfaces move quickly
 * across `@midnight-ntwrk/*` releases, so we deliberately type them loosely
 * here and let the host app pin real versions. The two functions in
 * `src/live/providers.ts` are the only places these are touched.
 */
declare module "@midnight-ntwrk/midnight-js-contracts";
declare module "@midnight-ntwrk/midnight-js-types";
declare module "@midnight-ntwrk/midnight-js-level-private-state-provider";
declare module "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
declare module "@midnight-ntwrk/midnight-js-http-client-proof-provider";
declare module "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
declare module "@midnight-ntwrk/dapp-connector-api";
