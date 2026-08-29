// Real Midnight wiring for this example.
//
// The membership circuit is already compiled (checked in under
// src/managed/membership/). To run real proofs:
//   1. deploy it once  — `node scripts/deploy.mjs`  (see the @midzap/sdk README)
//   2. register member commitments: deployed.callTx.addMember(commitment)
//   3. paste the address into MEMBERSHIP_CONTRACT_ADDRESS below
//   4. install the @midnight-ntwrk/* peer deps
//
// This v1 circuit checks the member commitment against an on-chain Set, so
// it is pseudonymous (repeat actions by one member are linkable). The
// fully-anonymous Merkle version is described in compact/README.md.

import type { ContractBindings } from "@midzap/sdk";

export const MEMBERSHIP_CONTRACT_ADDRESS = "0xREPLACE_WITH_DEPLOYED_MEMBERSHIP_ADDRESS";

export const contracts: ContractBindings = {
  membership: {
    address: MEMBERSHIP_CONTRACT_ADDRESS,
    // @ts-ignore -- generated module; its .d.ts pulls @midnight-ntwrk/compact-runtime.
    load: () => import("./managed/membership/contract/index.js"),
  },
};
