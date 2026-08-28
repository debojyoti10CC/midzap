# Compact predicate templates

Three reusable circuits. Every MidnightZap host app picks one of these
instead of writing its own.

| File | Circuit entrypoint | Backs |
|---|---|---|
| `threshold_proof.compact` | `proveThreshold(subjectId, threshold)` | `<ProveThreshold>` |
| `membership_proof.compact` | `proveMembership(actionTag)` | `<ProveMembership>` |
| `expiry_proof.compact` | `proveCredentialValid(nowUnix)` | `<ProveCredentialValid>` |

## Compile

```bash
# install the toolchain — see docs.midnight.network for the current channel
npm i -g @midnight-ntwrk/compact    # or the version your project pins

compact compile threshold_proof.compact   ./build/threshold
compact compile membership_proof.compact  ./build/membership
compact compile expiry_proof.compact      ./build/expiry
```

Each compile emits the prover key, verifier key, and the contract ABI.

## Deploy and wire into the live backend

Deploy each compiled contract with your usual Midnight deploy flow, then
hand the addresses to `LiveMidnightBackend`:

```ts
import { LiveMidnightBackend } from "@midnightzap/sdk";

const backend = new LiveMidnightBackend({
  network: "testnet",
  contracts: {
    threshold:          { address: "0x…", circuit: "proveThreshold" },
    membership:         { address: "0x…", circuit: "proveMembership" },
    "credential-valid": { address: "0x…", circuit: "proveCredentialValid" },
  },
});
```

Nothing in a host app changes — only the `backend` prop on
`<MidnightZapProvider>`.

## Status

These are written to the documented Compact syntax (`language_version
0.23`) but have **not** been run through the compiler in this repo. Treat a
clean `compact compile` as step one of any real deployment; stdlib
signatures (`persistentHash`, `disclose`, `merkleTreePathRoot`,
`verifySignature`) can shift between releases.
