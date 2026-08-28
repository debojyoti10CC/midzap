# Architecture

MidnightZap has one job: let a host app add a Midnight zero-knowledge gate
without writing Compact, touching a circuit, or learning the wallet stack.
It does that with three layers.

```
┌──────────────────────────────────────────────────────────────────────┐
│ HOST APP  (existing web2 React app — unchanged except the gate)       │
│                                                                      │
│   <MidnightZapProvider>                        {/* mock by default */}│
│     ...                                                              │
│     <ProveThreshold field="age" threshold={21}                       │
│       getPrivateValue={() => year - user.birthYear}>                  │
│       <CompletePurchaseButton />              {/* gated content */}   │
│     </ProveThreshold>                                                │
│   </MidnightZapProvider>                                             │
└───────────────┬──────────────────────────────────────────────────────┘
                │  picks a predicate + supplies a getter for private data
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│ SDK — React layer  (packages/midnightzap-sdk/src/react)              │
│   ProveThreshold · ProveMembership · ProveCredentialValid            │
│   → predicate wiring only; share GateShell for the styled default    │
│   UI (trigger · progress · badge · retry · gated children · render)  │
│   MidnightZapProvider (mock by default) · useProof() · VerifiedBadge │
├──────────────────────────────────────────────────────────────────────┤
│ SDK — core  (packages/midnightzap-sdk/src/core)                      │
│   MidnightZapClient.prove(predicate, subjectId, privateInput)        │
│   Predicate = threshold | membership | credential-valid              │
└───────────────┬──────────────────────────────────────────────────────┘
                │  ProofBackend interface — one seam, two implementations
        ┌───────┴────────────────────────┐
        ▼                                ▼
┌───────────────────────┐   ┌──────────────────────────────────────────┐
│ MockProofBackend      │   │ LiveMidnightBackend                      │
│ deterministic, in-mem │   │ wallet connect + Compact contract calls  │
│ evaluates the SAME    │   │ against a deployed predicate contract    │
│ logic the circuits do │   │ (scaffold — see core/liveBackend.ts)     │
│ → demos run offline   │   │                                          │
└───────────────────────┘   └───────────────┬──────────────────────────┘
                                            ▼
                            ┌──────────────────────────────────────────┐
                            │ COMPACT PREDICATE TEMPLATES  (/compact)   │
                            │  threshold_proof.compact                  │
                            │  membership_proof.compact  (+ nullifier)  │
                            │  expiry_proof.compact                     │
                            │  compiled + deployed once, reused by all  │
                            │  host apps that pick that predicate       │
                            └──────────────────────────────────────────┘
```

## The one seam that matters: `ProofBackend`

```ts
interface ProofBackend {
  connect(): Promise<void>;
  requestProof(req, privateInput, onStatus?): Promise<ProofResult>;
}
```

Everything above this interface — every component, every host-app line —
is identical whether you run mocked or live. Going to a real Midnight
network is one line:

```diff
- <MidnightZapProvider backend={new MockProofBackend()}>
+ <MidnightZapProvider backend={new LiveMidnightBackend({ network: "testnet" })}>
```

`MockProofBackend` is not a fake: it runs the exact accept/reject logic the
Compact circuits enforce (threshold comparison, nullifier double-spend
check, expiry comparison), so a demo on a plane behaves the same as a demo
on testnet — it just skips proof generation and on-chain submission.

## Why predicates instead of circuits

A host app never sees Compact. It picks one of three pre-written,
pre-audited circuit shapes and passes parameters:

| Predicate         | Public inputs            | Private witness (never leaves device) | Proves |
|-------------------|--------------------------|---------------------------------------|--------|
| `threshold`       | `field`, `threshold`     | the value                             | value ≥ threshold |
| `membership`      | `set`, `actionTag`       | member secret + Merkle path           | caller ∈ set, and not replayed for this action |
| `credential-valid`| `issuer`, `nowUnix`      | issuer sig + credential hash + expiry | validly-signed, unexpired credential |

Shipping a new privacy feature is choosing a row, not writing a circuit.

## Data-flow guarantees

- The private value is read by a **getter function the host app provides**
  (`getPrivateValue` / `getMemberSecret` / `getExpiresAtUnix`). MidnightZap
  never asks for a document upload or an ID scan.
- That value is consumed **locally** to build the proof. Only the proof
  (and an opaque, non-reversible receipt) crosses the wire.
- `subjectId` is an id the host app already has for the session. It is
  never a real-world identity and never derived from the private value.
