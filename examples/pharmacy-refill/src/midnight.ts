// Wiring for the real Midnight backend. Fill in after docs/GO_LIVE.md:
//   1. compactc compile compact/expiry_proof.compact ./src/managed/expiry
//   2. cp -r src/managed public/
//   3. deploy once, paste the address below.
//
// Note: live credential proofs also need the signed credential parts.
// Supply them via
//   <ProveCredentialValid getExtraWitness={() => ({ issuerPublicKey, issuerSignature, credentialHash })} />

import type { ContractBindings } from "@midnightzap/sdk";

export const EXPIRY_CONTRACT_ADDRESS = "0xREPLACE_WITH_DEPLOYED_EXPIRY_ADDRESS";

export const contracts: ContractBindings = {
  "credential-valid": {
    address: EXPIRY_CONTRACT_ADDRESS,
    // @ts-ignore -- placeholder until `compactc` emits the real module.
    load: () => import("./managed/expiry/contract/index.cjs"),
  },
};
