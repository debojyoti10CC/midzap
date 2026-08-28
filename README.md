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
examples/pharmacy-refill/       BEFORE/AFTER: prescription photo upload → ZK "credential valid" proof
scripts/smoke-test.mjs          Headless test proving the predicate logic is correct
scripts/gen-diffs.mjs           Regenerates the docs/*.diff.txt files from example source
scripts/deploy.mjs              One-time deploy of the three predicate contracts
docs/GO_LIVE.md                 The one-time compile + deploy that makes proofs real
docs/ARCHITECTURE.md            The three layers and the one seam (ProofBackend)
docs/DEMO_SCRIPT.md             Paced ~1:50 script for the demo video
docs/ecommerce.diff.txt         Literal unified diff for the checkout integration
docs/forum.diff.txt             Literal unified diff for the forum integration
docs/pharmacy.diff.txt          Literal unified diff for the pharmacy integration
```

One example per predicate — `<ProveThreshold>`, `<ProveMembership>`,
`<ProveCredentialValid>` — each shipping as a real before/after diff.

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

One interface (`ProofBackend`), and `LiveMidnightBackend` is the default —
real wallet, real Compact contracts, real Midnight proofs (see
`docs/ARCHITECTURE.md`):

- **`LiveMidnightBackend`** *(default)* — discovers the injected
  `window.midnight` wallet, builds the midnight-js providers (proof server,
  indexer, private-state, zk-config), loads your `compactc` output, seeds
  the circuit's private state on-device, calls the circuit, submits, and
  returns the tx id. Point it at your deployed contracts with
  `<MidnightZapProvider contracts={{ … }}>`. The `@midnight-ntwrk/*` stack
  is an optional peer dependency, loaded lazily. Full setup:
  **`docs/GO_LIVE.md`**.
- **`InMemoryProofBackend`** — evaluates the same accept/reject logic the
  circuits enforce, deterministically and offline. **Unit tests only** —
  pass it explicitly as `backend`. It does not produce proofs and is not a
  way to run the app.

## Quickstart

```bash
npm install
npm run verify           # build SDK + typecheck every workspace + predicate logic test

npm run dev:ecommerce    # http://localhost:5173 — age-gate checkout
npm run dev:forum        # http://localhost:5174 — anonymous verified forum
npm run dev:pharmacy     # http://localhost:5175 — private "prescription still valid"
```

The example apps render immediately, but a proof needs the one-time
**`docs/GO_LIVE.md`** setup (compile the circuits with `compactc`, deploy
once, paste the addresses into each `src/midnight.ts`). Until then the
trigger button returns a clear "no deployed contract" error — never a fake
success.

Other scripts: `npm run build` (SDK + all examples), `npm test` (predicate
logic test), `npm run gen:diffs` (regenerate the diff docs). CI runs the
same on every push — `.github/workflows/ci.yml`.

## Add MidnightZap to your own app

Full version in `docs/GO_LIVE.md`; the shape:

1. `npm install @midnightzap/sdk` plus the `@midnight-ntwrk/*` peer deps.
2. Wrap the subtree that needs a gate, once, pointing at your deployed
   contracts (the addresses come from the one-time deploy in
   `docs/GO_LIVE.md`):
   ```tsx
   import { MidnightZapProvider } from "@midnightzap/sdk/react";

   <MidnightZapProvider network="testnet" contracts={{
     threshold: { address: "0x…", load: () => import("./managed/threshold/contract/index.cjs") },
   }}>
     <App />
   </MidnightZapProvider>
   ```
3. Put the thing you're gating inside a predicate component and pass a
   getter for the private value. The child is revealed once the proof
   verifies — no `useState` to wire:
   ```tsx
   <ProveThreshold field="age" threshold={21}
     getPrivateValue={() => new Date().getFullYear() - user.birthYear}>
     <CheckoutButton />
   </ProveThreshold>
   ```
   Prefer callbacks or custom UI? Use `onVerified` / `onRejected` /
   `onError`, the `render={(state) => …}` prop, or the `useProof(predicate)`
   hook directly. Theme with CSS variables (`--mz-accent`, `--mz-radius`, …)
   or pass `unstyled`.

The package-level [`packages/midnightzap-sdk/README.md`](packages/midnightzap-sdk/README.md)
has the full component/prop reference.

## The before/after story (Integrate Midnight track)

All three examples ship as a real, regenerated diff, not a description:

- **Age gate** — `ecommerce-age-gate/App.before.tsx` is a self-reported
  checkbox ("I confirm I am 21+"); `App.tsx` replaces it with
  `<ProveThreshold>`. Diff: `docs/ecommerce.diff.txt`.
- **Anonymous membership** — `forum-anon-login/App.before.tsx` is real-name
  company login, tying every "candid" post to an employee forever; `App.tsx`
  swaps in `<ProveMembership>` — provably a current employee, provably not
  posting twice under one thread, never which employee. Diff:
  `docs/forum.diff.txt`.
- **Credential validity** — `pharmacy-refill/App.before.tsx` uploads a photo
  of a paper prescription for the pharmacy to store; `App.tsx` swaps in
  `<ProveCredentialValid>` — proof the prescription is signed and unexpired,
  with no document, name, prescriber, or dates disclosed. Diff:
  `docs/pharmacy.diff.txt`.

The diffs are generated by `npm run gen:diffs` and CI fails if they drift
from the example source.

## Judging criteria, mapped

- **Technology** — a real abstraction layer over three distinct ZK circuit
  shapes (threshold / membership+nullifier / issuer-signature+expiry), a
  pluggable backend (`LiveMidnightBackend` by default; a same-logic
  in-memory backend for unit tests), and three working integrations, not one.
- **Originality** — Midnight's hackathon history so far is mostly one-off
  identity/compliance apps; this is developer infrastructure that makes the
  *next* fifty of those apps cheaper to build.
- **Execution** — SDK and all three examples build, typecheck, and pass a
  headless end-to-end check of every predicate; CI enforces all of it.
- **Completion** — deliberately scoped to 3 predicate templates + 3 React
  components + 3 one-per-predicate integrations rather than one sprawling app.
- **Documentation** — this README, `docs/ARCHITECTURE.md`, and two literal
  unified diffs *are* the product story.
- **Business value** — dev tooling is the highest-leverage thing to build in
  a young ecosystem; "add privacy to your existing app in an afternoon" is a
  sellable product on its own.

## Honesty notes

- `LiveMidnightBackend` is the real path: wallet discovery, provider
  wiring, on-device private-state seeding, circuit call, submit. It runs
  once you complete `docs/GO_LIVE.md` (compile + deploy). Two spots depend
  on your environment: the exact `@midnight-ntwrk/*` versions (field names
  on `serviceUriConfig()` / `wallet.state()` have drifted across releases)
  and the deployed contract addresses.
- The `.compact` files are real Compact syntax based on official docs but
  have **not** been run through `compactc` here — expect to fix stdlib
  signatures on the first compile.
- The checked-in `examples/**/managed/**/index.cjs` files are build
  placeholders that *throw* if invoked. `compactc` overwrites them. They
  are not proof mocks.
- `InMemoryProofBackend` runs the circuits' accept/reject *logic* for unit
  tests. It is not proof generation and not a way to run the app.
