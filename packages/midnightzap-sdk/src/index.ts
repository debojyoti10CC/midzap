export * from "./core/types.js";
export { MidnightZapClient } from "./core/client.js";
export { LiveMidnightBackend } from "./core/liveBackend.js";
export type { LiveMidnightBackendOptions } from "./core/liveBackend.js";
export type { ContractBinding, ContractBindings } from "./core/types.js";

// Test double — not for running the app. See its doc comment.
export { InMemoryProofBackend, MockProofBackend } from "./core/inMemoryBackend.js";

// Advanced: witness maps + provider wiring, if you drive the stack yourself.
export {
  thresholdWitnesses,
  membershipWitnesses,
  expiryWitnesses,
} from "./live/witnesses.js";
export { configureProviders } from "./live/providers.js";
