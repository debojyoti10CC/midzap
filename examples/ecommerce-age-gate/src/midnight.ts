// Real Midnight wiring for this example.
//
// The threshold circuit is already compiled (checked in under
// src/managed/threshold/). To run real proofs you still need to:
//   1. deploy it once  — `node scripts/deploy.mjs`  (see docs/GO_LIVE.md)
//   2. paste its address into THRESHOLD_CONTRACT_ADDRESS below
//   3. install the @midnight-ntwrk/* peer deps
//
// Until the address is set, the checkout renders and clicking "Prove age…"
// returns a clear "no deployed contract" error — never a fake success.

import type { ContractBindings } from "@midnightzap/sdk";

export const THRESHOLD_CONTRACT_ADDRESS = "0xREPLACE_WITH_DEPLOYED_THRESHOLD_ADDRESS";

export const contracts: ContractBindings = {
  threshold: {
    address: THRESHOLD_CONTRACT_ADDRESS,
    // @ts-ignore -- generated module; its .d.ts pulls @midnight-ntwrk/compact-runtime.
    load: () => import("./managed/threshold/contract/index.js"),
  },
};
