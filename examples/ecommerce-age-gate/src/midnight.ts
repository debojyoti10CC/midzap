// Wiring for the real Midnight backend.
//
// Fill this in after the one-time setup in docs/GO_LIVE.md:
//   1. compactc compile compact/threshold_proof.compact  ./src/managed/threshold
//   2. cp -r src/managed public/                          (so the browser can fetch zk-params)
//   3. deploy the contract once, paste its address below.
//
// Until then the app loads and the checkout renders, but clicking
// "Prove age…" returns a clear "no deployed contract" error instead of a
// fake success.

import type { ContractBindings } from "@midnightzap/sdk";

export const THRESHOLD_CONTRACT_ADDRESS = "0xREPLACE_WITH_DEPLOYED_THRESHOLD_ADDRESS";

export const contracts: ContractBindings = {
  threshold: {
    address: THRESHOLD_CONTRACT_ADDRESS,
    // `managed/` is emitted by `compactc` (step 1). A placeholder module is
    // checked in so the app builds before you compile; it throws if invoked.
    // @ts-ignore -- resolved to real types once compiled.
    load: () => import("./managed/threshold/contract/index.cjs"),
  },
};
