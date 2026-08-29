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
hand the addresses to `<MidnightZapProvider>`:

```tsx
<MidnightZapProvider network="testnet" contracts={{
  threshold:          { address: "0x…", load: () => import("./managed/threshold/contract/index.js") },
  membership:         { address: "0x…", load: () => import("./managed/membership/contract/index.js") },
  "credential-valid": { address: "0x…", load: () => import("./managed/expiry/contract/index.js") },
}}>
```

The circuit entrypoint names (`proveThreshold`, `proveMembership`,
`proveCredentialValid`) and witness maps are baked into the SDK — you only
supply the address and the compiled-module `load`. Full walkthrough: the
**Real proofs on Midnight** section of the
[`@midzap/sdk` README](../packages/midnightzap-sdk/README.md).

## Status

All three compile with the `compact` toolchain **0.34.0**; the compiled
output is checked in under `examples/*/src/managed/`, so nothing here needs
a toolchain to run.

`threshold` is fully private — the value is proven against the threshold
and never disclosed. `membership` and `expiry` ship a **v1** that checks a
member commitment / credential hash against an on-chain `Set` / `Map`; that
is pseudonymous (repeat actions by one holder are linkable). The
fully-anonymous version keeps only a Merkle root on-chain and proves
inclusion with a witness path (`merkleTreePathRoot`) — swap the ledger
type, add `witness merkleProof()`, and pass the path via
`getExtraWitness`.
