// Real Midnight wiring for this example.
//
// The expiry circuit is already compiled (checked in under
// src/managed/expiry/). To run real proofs:
//   1. deploy it once  — `node scripts/deploy.mjs`  (see docs/GO_LIVE.md)
//   2. register credentials: deployed.callTx.registerCredential(hash, expiresAtUnix)
//   3. paste the address into EXPIRY_CONTRACT_ADDRESS below
//   4. install the @midnight-ntwrk/* peer deps
//
// v1: the proof reveals the credential hash (a one-way hash, never the
// document / name / prescriber / dates) and proves its on-chain expiry is
// still in the future. The fully-hidden Merkle version is in compact/NOTES.md.
//
// The <ProveCredentialValid> here must also pass the hash for live mode:
//   getExtraWitness={() => ({ credentialHash })}

import type { ContractBindings } from "@midzap/sdk";

export const EXPIRY_CONTRACT_ADDRESS = "0xREPLACE_WITH_DEPLOYED_EXPIRY_ADDRESS";

export const contracts: ContractBindings = {
  "credential-valid": {
    address: EXPIRY_CONTRACT_ADDRESS,
    // @ts-ignore -- generated module; its .d.ts pulls @midnight-ntwrk/compact-runtime.
    load: () => import("./managed/expiry/contract/index.js"),
  },
};
