# MidnightZap

**Add real, Midnight-powered zero-knowledge privacy to an existing web2 app in minutes — not months.**

MidnightZap is what a StarkZap-style "money toolkit" looks like when the thing
you're plugging into any app isn't payments, it's privacy. Instead of asking a
developer to learn Compact and write a ZK circuit, MidnightZap ships a small
library of pre-built, pre-written privacy **predicates** — "is this value
above a threshold," "is this caller a member of this private set," "is this
credential still valid" — as drop-in React components and a framework-agnostic
client. Point a component at a predicate, hand it a getter for the private
value, and you have a working zero-knowledge gate.

```tsx
<ProveThreshold
  field="age"
  threshold={21}
  getPrivateValue={() => currentYear - user.birthYear}
>
  <button>Complete purchase</button>   {/* revealed only after the proof verifies */}
</ProveThreshold>
```

No document upload. No ID scan. No `useState`, no wallet code. The app
never sees the birth year — only a cryptographic proof that the threshold
was met.

Everything in this repo builds, typechecks, and passes its predicate tests:
`npm install && npm run verify`.

## Why this, and why now

Midnight hit mainnet this year with programmable privacy and Compact as its
smart-contract language, but almost every example app built on it so far is a
one-off — one team building one identity app, one team building one
compliance app. Meanwhile the actual bottleneck for adoption is the same one
every new chain hits: integrating with an *existing* product is expensive
enough that most teams don't bother. MidnightZap is infrastructure, not an
app — it's the thing that makes "add privacy to my existing app" a component
swap instead of a research project.

## What's in this repo

```
compact/                        Three Compact circuit templates (see below)
packages/midnightzap-sdk/       The SDK: framework-agnostic core + React layer
examples/ecommerce-age-gate/    BEFORE/AFTER: web2 checkbox age-gate → real ZK proof
examples/forum-anon-login/      BEFORE/AFTER: real-name login → anonymous verified posting
scripts/smoke-test.mjs          Headless test proving the predicate logic is correct
scripts/gen-diffs.mjs           Regenerates the docs/*.diff.txt files from example source
docs/ARCHITECTURE.md            The three layers and the one seam (ProofBackend)
docs/DEMO_SCRIPT.md             Paced ~1:50 script for the demo video
docs/ecommerce.diff.txt         Literal unified diff for the checkout integration
docs/forum.diff.txt             Literal unified diff for the forum integration
```

### The three predicate templates (`/compact`)

| Template | Proves | Component |
|---|---|---|
| `threshold_proof.compact` | A private number meets/exceeds a public threshold (age, income, credit score, balance...) | `<ProveThreshold>` |
| `membership_proof.compact` | Caller belongs to a private set (employees, licensed professionals, DAO members...), with a nullifier so one credential can't be replayed to double-act | `<ProveMembership>` |
| `expiry_proof.compact` | A credential was issued by a trusted issuer and hasn't expired, without revealing its contents or dates | `<ProveCredentialValid>` |

These are written against the Compact syntax documented at
docs.midnight.network (language_version 0.23). They're the actual circuit
logic — not simplified pseudocode — but **compile them against your installed
`compact` toolchain before deploying**; Compact's stdlib is still moving fast
post-mainnet and exact signatures can shift between releases.

### The SDK (`packages/midnightzap-sdk`)

Two backends, one interface (`ProofBackend`) — this seam is the whole design
(see `docs/ARCHITECTURE.md`):

- **`MockProofBackend`** — deterministic, in-memory, zero network calls.
  Evaluates the *same logic* the Compact circuits enforce, so the demo
  behaves honestly, but needs no testnet, faucet, or wallet extension. This
  is what both example apps use, so they run instantly anywhere.
- **`LiveMidnightBackend`** — the real adapter, scaffolded against
  `@midnight-ntwrk/wallet-api`, `@midnight-ntwrk/dapp-connector-api`, and
  `@midnight-ntwrk/midnight-js-contracts`. It's intentionally left as a
  checklist (see the TODOs in `src/core/liveBackend.ts`) rather than faked,
  because wiring a real wallet connection needs a browser with an installed
  wallet extension and a deployed contract address — neither of which exists
  in a clean checkout. Swapping it in is a one-line change:
  `<MidnightZapProvider backend={new LiveMidnightBackend()}>` — nothing
  else in a host app changes.

## Quickstart

```bash
npm install
npm run verify            # build SDK + typecheck all workspaces + predicate smoke test

npm run dev:ecommerce     # http://localhost:5173 — age-gated checkout demo
npm run dev:forum         # http://localhost:5174 — anonymous verified forum demo
```

Other scripts: `npm run build` (SDK + both examples), `npm test` (smoke test
only), `npm run gen:diffs` (regenerate the diff docs from example source).
CI runs the same steps on every push — `.github/workflows/ci.yml`.

## Add MidnightZap to your own app

1. `npm install @midnightzap/sdk` (workspace-local in this repo).
2. Wrap the subtree that needs a gate, once — no props needed, it defaults
   to an offline mock backend:
   ```tsx
   import { MidnightZapProvider } from "@midnightzap/sdk/react";

   <MidnightZapProvider>
     <App />
   </MidnightZapProvider>
   ```
3. Put the thing you're gating inside a predicate component and pass a
   getter for the private value. The child is revealed once the proof
   verifies — no `useState` to wire:
   ```tsx
   <ProveCredentialValid
     issuer="pharmacy-board"
     getExpiresAtUnix={() => localCredentialStore.get("rx").expiresAt}
   >
     <RefillButton />
   </ProveCredentialValid>
   ```
   Prefer callbacks or custom UI? Use `onVerified` / `onRejected` /
   `onError`, the `render={(state) => …}` prop, or the `useProof(predicate)`
   hook directly. Theme every component with CSS variables
   (`--mz-accent`, `--mz-radius`, …) or pass `unstyled`.
4. When you're ready for a real network: compile the matching
   `compact/*.compact` template, deploy it, fill in
   `src/core/liveBackend.ts`, and pass
   `backend={new LiveMidnightBackend({ network: "testnet" })}` to the
   provider. Nothing below it changes.

The package-level [`packages/midnightzap-sdk/README.md`](packages/midnightzap-sdk/README.md)
has the full component/prop reference.

## The before/after story (Integrate Midnight track)

Both examples ship as a real, regenerated diff, not a description:

- `examples/ecommerce-age-gate/src/App.before.tsx` → a self-reported
  checkbox ("I confirm I am 21+"), which proves nothing.
- `examples/ecommerce-age-gate/src/App.tsx` → the same page with the
  checkbox replaced by `<ProveThreshold>` and the tree wrapped in
  `<MidnightZapProvider>`. Full diff: `docs/ecommerce.diff.txt`.
- `examples/forum-anon-login/src/App.before.tsx` → real-name company login,
  so every "candid" post is quietly tied to a real employee forever.
- `examples/forum-anon-login/src/App.tsx` → the same forum with real-name
  login replaced by `<ProveMembership>` — provably a current employee,
  provably not the same employee posting twice under one thread, and never
  which employee. Full diff: `docs/forum.diff.txt`.

The diffs are generated by `npm run gen:diffs` and CI fails if they drift
from the example source.

## Judging criteria, mapped

- **Technology** — a real abstraction layer over three distinct ZK circuit
  shapes (threshold / membership+nullifier / issuer-signature+expiry), a
  pluggable backend so the same component tree runs mocked or live, and two
  working integrations, not one.
- **Originality** — Midnight's hackathon history so far is mostly one-off
  identity/compliance apps; this is developer infrastructure that makes the
  *next* fifty of those apps cheaper to build.
- **Execution** — SDK and both examples build, typecheck, and pass a
  headless end-to-end check of every predicate; CI enforces all of it.
- **Completion** — deliberately scoped to 3 predicate templates + 3 React
  components + 2 real integrations rather than one sprawling app.
- **Documentation** — this README, `docs/ARCHITECTURE.md`, and two literal
  unified diffs *are* the product story.
- **Business value** — dev tooling is the highest-leverage thing to build in
  a young ecosystem; "add privacy to your existing app in an afternoon" is a
  sellable product on its own.

## Honesty notes

- `LiveMidnightBackend` is a scaffold, not a finished driver — see the file
  for exactly what's left and why (browser wallet + deployed contract
  address are needed, and neither exists in a sandboxed build).
- The `.compact` files are real Compact syntax based on official docs, not
  fabricated pseudocode, but have not been run through the `compact`
  compiler in this environment — compile-check them before you deploy.
- `MockProofBackend` runs the circuits' accept/reject *logic*, not real
  proof generation. It exists so demos are reproducible offline, not to
  stand in for a security audit.
