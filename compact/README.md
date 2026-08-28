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
  threshold:          { address: "0x…", load: () => import("./managed/threshold/contract/index.cjs") },
  membership:         { address: "0x…", load: () => import("./managed/membership/contract/index.cjs") },
  "credential-valid": { address: "0x…", load: () => import("./managed/expiry/contract/index.cjs") },
}}>
```

The circuit entrypoint names (`proveThreshold`, `proveMembership`,
`proveCredentialValid`) and witness maps are baked into the SDK — you only
supply the address and the compiled-module `load`. Full walkthrough:
`docs/GO_LIVE.md`.

## Status

Written to the documented Compact syntax but **not** yet run through the
compiler. `NOTES.md` in this folder lists the specific spots most likely to
need a fix on the first `compactc compile`, in the order the compiler hits
them. Treat a clean compile as step one of any real deployment.
