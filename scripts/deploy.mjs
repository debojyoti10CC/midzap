// One-time deploy of the three predicate contracts to a Midnight network.
//
// Prerequisites:
//   1. `compact compile` each template into <example>/src/managed/<circuit>
//      (already done in this repo — the compiled output is checked in).
//   2. npm i @midnight-ntwrk/midnight-js-contracts \
//            @midnight-ntwrk/midnight-js-level-private-state-provider \
//            @midnight-ntwrk/midnight-js-indexer-public-data-provider \
//            @midnight-ntwrk/midnight-js-http-client-proof-provider \
//            @midnight-ntwrk/midnight-js-fetch-zk-config-provider \
//            @midnight-ntwrk/dapp-connector-api
//   3. A wallet/provider context. In a browser: run this logic from a page
//      with the wallet unlocked. Headless: use @midnight-ntwrk/wallet +
//      a local proof server (docs.midnight.network).
//
// Then: `node scripts/deploy.mjs` and paste the printed addresses into each
// example's src/midnight.ts.

import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import { configureProviders } from "../packages/midnightzap-sdk/dist/index.js";
import {
  thresholdWitnesses,
  membershipWitnesses,
  expiryWitnesses,
} from "../packages/midnightzap-sdk/dist/index.js";

const TARGETS = [
  {
    name: "threshold",
    module: "../examples/ecommerce-age-gate/src/managed/threshold/contract/index.js",
    witnesses: thresholdWitnesses,
    privateStateId: "mz-threshold",
    initialPrivateState: { value: 0n },
  },
  {
    name: "membership",
    module: "../examples/forum-anon-login/src/managed/membership/contract/index.js",
    witnesses: membershipWitnesses,
    privateStateId: "mz-membership",
    initialPrivateState: { memberSecret: new Uint8Array(32) },
  },
  {
    name: "credential-valid",
    module: "../examples/pharmacy-refill/src/managed/expiry/contract/index.js",
    witnesses: expiryWitnesses,
    privateStateId: "mz-expiry",
    initialPrivateState: { credentialHash: new Uint8Array(32) },
  },
];

// After deploy, register members / credentials with the operator circuits:
//   membership: deployed.callTx.addMember(commitmentBytes32)
//   expiry:     deployed.callTx.registerCredential(hashBytes32, expiresAtUnix)

const { providers } = await configureProviders();

for (const t of TARGETS) {
  const { Contract } = await import(t.module);
  const deployed = await deployContract(providers, {
    contract: new Contract(t.witnesses),
    privateStateId: t.privateStateId,
    initialPrivateState: t.initialPrivateState,
  });
  console.log(`${t.name}: ${deployed.deployTxData.public.contractAddress}`);
}
