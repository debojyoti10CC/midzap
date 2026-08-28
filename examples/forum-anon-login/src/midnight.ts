// Wiring for the real Midnight backend. Fill in after docs/GO_LIVE.md:
//   1. compactc compile compact/membership_proof.compact ./src/managed/membership
//   2. cp -r src/managed public/
//   3. deploy once, paste the address below.
//
// Note: live membership proofs also need the caller's Merkle path (from
// your set operator's tree service). Supply it via
//   <ProveMembership getExtraWitness={() => ({ merklePath })} />

import type { ContractBindings } from "@midnightzap/sdk";

export const MEMBERSHIP_CONTRACT_ADDRESS = "0xREPLACE_WITH_DEPLOYED_MEMBERSHIP_ADDRESS";

export const contracts: ContractBindings = {
  membership: {
    address: MEMBERSHIP_CONTRACT_ADDRESS,
    // @ts-ignore -- placeholder until `compactc` emits the real module.
    load: () => import("./managed/membership/contract/index.cjs"),
  },
};
