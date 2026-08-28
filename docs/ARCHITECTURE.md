# Architecture

MidnightZap has one job: let a host app add a Midnight zero-knowledge gate
without writing Compact, touching a circuit, or learning the wallet stack.
It does that with three layers.

```
┌──────────────────────────────────────────────────────────────────────┐
│ HOST APP  (existing web2 React app — unchanged except the gate)       │
│                                                                      │
│   <MidnightZapProvider contracts={{…}}>       {/* Live by default */}│
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
│   MidnightZapProvider (Live by default) · useProof() · VerifiedBadge │
├──────────────────────────────────────────────────────────────────────┤
│ SDK — core  (packages/midnightzap-sdk/src/core)                      │
│   MidnightZapClient.prove(predicate, subjectId, privateInput)        │
│   Predicate = threshold | membership | credential-valid              │
└───────────────┬──────────────────────────────────────────────────────┘
                │  ProofBackend interface — one seam
        ┌───────┴────────────────────────┐
        ▼                                ▼
┌───────────────────────┐   ┌──────────────────────────────────────────┐
│ LiveMidnightBackend   │   │ InMemoryProofBackend                     │
│ (DEFAULT)             │   │ same accept/reject logic, no network     │
│ wallet + providers +  │   │ UNIT TESTS ONLY — not a proof, not a     │
│ compiled circuit call │   │ way to run the app                       │
│ + submit → tx id      │   └──────────────────────────────────────────┘
└───────────┬───────────┘
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

Everything above this interface — every component, every host-app line — is
identical regardless of backend. The default is `LiveMidnightBackend`,
configured from the provider's `contracts` prop:

```tsx
<MidnightZapProvider network="testnet" contracts={{
  threshold: { address: "0x…", load: () => import("./managed/threshold/contract/index.js") },
}}>
```

`LiveMidnightBackend.requestProof` does: discover wallet → build midnight-js
providers (proof server, indexer, private-state, zk-config) → load the
compiled circuit → seed its private state from the component's getter,
on-device → `findDeployedContract` → call the circuit (proof generated
client-side) → submit → return the tx id as the receipt.

`InMemoryProofBackend` runs only the accept/reject logic (threshold compare,
nullifier double-spend check, expiry compare) for unit tests. It is not a
proof and not a way to run the app — pass it explicitly as `backend` in a
test, never in shipped code.

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
