# MidnightZap

**Turn an existing web2 app into a Midnight zero-knowledge privacy app — one command.**

```bash
npx @midnightzap/cli add age-gate ./my-shop
```

That finds the self-reported control gating an action — an "I am 21+"
checkbox, a licence upload, a real-name login — rewrites it as a
zero-knowledge predicate, wraps your app in a provider, drops in a
compiled Compact circuit, and patches your build. `--dry-run` shows the
whole thing as a diff first.

Under the CLI is **`@midnightzap/sdk`**: pre-written, pre-compiled privacy
**predicates** — "is this value above a threshold", "is this caller in a
private set", "is this credential still valid" — as drop-in React
components. No Compact, no circuit, no wallet plumbing in your app.

```tsx
<ProveThreshold field="age" threshold={21}
  getPrivateValue={() => currentYear - user.birthYear}>
  <button>Complete purchase</button>   {/* revealed only after the proof verifies */}
</ProveThreshold>
```

The app never sees the birth year — only a cryptographic proof that the
threshold was met.

Everything here builds, typechecks, and passes — including an end-to-end
test that runs the CLI on a plain web2 app and compiles the result:
`npm install && npm run verify`.

## Why this, and why now

Midnight hit mainnet this year with Compact as its smart-contract language,
but the bottleneck for adoption is the same one every new chain hits:
integrating with an *existing* product is expensive enough that most teams
don't bother. MidnightZap is infrastructure — the CLI makes "add privacy to
my app" a `git diff` you review, not a research project.

## Why this, and why now

## The CLI

```bash
npx @midnightzap/cli add <recipe> [dir]   # age-gate | anon-login | credential-check
npx @midnightzap/cli list
npx @midnightzap/cli doctor [dir]
  --dry-run   print the diff, write nothing
```

`add` touches six things: the gated component (→ `<Prove…>`), the app root
(→ `<MidnightZapProvider>`), a new `src/midnight.ts` binding, a copied-in
compiled circuit, `vite.config.*` (marks the Midnight WASM runtime
external), and `package.json`. Try it on the bundled demo target:

```bash
npx @midnightzap/cli add age-gate examples/plain-shop --dry-run
```

Full reference: [`packages/midnightzap-cli/README.md`](packages/midnightzap-cli/README.md).

## What's in this repo

```
packages/midnightzap-cli/       The CLI: text-level codemods (age-gate / anon-login / credential-check)
packages/midnightzap-sdk/       The SDK: framework-agnostic core + React layer
compact/                        Three Compact circuit templates + NOTES.md (compile fixes)
examples/plain-shop/            A pristine web2 checkout — the CLI's "before"
examples/ecommerce-age-gate/    BEFORE/AFTER: checkbox age-gate → ProveThreshold
examples/forum-anon-login/      BEFORE/AFTER: real-name login → ProveMembership
examples/pharmacy-refill/       BEFORE/AFTER: prescription upload → ProveCredentialValid
scripts/cli-e2e.mjs             Runs the CLI on plain-shop, builds the result, restores it
scripts/smoke-test.mjs          Headless test of the predicate accept/reject logic
scripts/gen-diffs.mjs           Regenerates docs/*.diff.txt from example source
scripts/deploy.mjs              One-time deploy of the three predicate contracts
docs/GO_LIVE.md                 The one-time compile + deploy that makes proofs real
docs/ARCHITECTURE.md            The layers and the one seam (ProofBackend)
docs/DEMO_SCRIPT.md             Paced ~1:50 demo-video script
docs/*.diff.txt                 Literal unified diffs for the three integrations
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

The circuits are compiled and checked in. The example apps run their
**predicate logic in-browser** (`InMemoryProofBackend`) for local preview,
because the `@midnight-ntwrk` browser runtime (WASM + top-level await) does
not bundle in a stock Vite app — that setup is the bulk of
**`docs/GO_LIVE.md`**. With a working Midnight Vite baseline + deployed
contracts, `VITE_MZ_LIVE=1 npm run dev:ecommerce` switches every example to
the real `LiveMidnightBackend` (the SDK's default) with no code change.

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
     threshold: { address: "0x…", load: () => import("./managed/threshold/contract/index.js") },
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

- **Technology** — a codemod CLI over an SDK over three real, `compact`-0.34
  compiled circuits; a pluggable backend (`LiveMidnightBackend` by default);
  three worked integrations plus the CLI conversion, all tested.
- **Originality** — Midnight's hackathon history is one-off identity apps.
  This is the tooling layer: `npx @midnightzap/cli add age-gate` turns
  "integrate Midnight" into a reviewable diff.
- **Execution** — `npm run verify` builds the SDK + CLI, typechecks 6
  workspaces, runs the predicate logic test, and runs a **CLI end-to-end
  test** that converts a plain web2 app and compiles the output.
- **Completion** — 3 compiled circuits + 3 React components + 3 CLI recipes
  + 3 before/after integrations + a plain "before" target, all wired.
- **Documentation** — this README, `packages/*/README.md`,
  `docs/ARCHITECTURE.md`, `docs/GO_LIVE.md`, and three literal unified diffs.
- **Business value** — "add privacy to your existing app with one command"
  is the highest-leverage thing to ship in a young ecosystem.

## Honesty notes

- `LiveMidnightBackend` is the real path: wallet discovery, provider
  wiring, on-device private-state seeding, circuit call, submit. It runs
  once you complete `docs/GO_LIVE.md` (compile + deploy). Two spots depend
  on your environment: the exact `@midnight-ntwrk/*` versions (field names
  on `serviceUriConfig()` / `wallet.state()` have drifted across releases)
  and the deployed contract addresses.
- All three `.compact` files compile with the `compact` toolchain 0.34.0.
  The compiled output (`examples/**/src/managed/`) is checked in so the
  repo runs without the toolchain. `compact/NOTES.md` records the fixes the
  first compile needed.
- `membership` and `expiry` ship a **v1** circuit: membership checks a
  member commitment against an on-chain `Set` (pseudonymous — repeat
  actions by one member are linkable); expiry checks a credential hash
  against an on-chain registry `Map`. The fully-anonymous Merkle versions
  and the upgrade path are in `compact/NOTES.md`. `threshold` has no such
  caveat.
- `InMemoryProofBackend` runs the circuits' accept/reject *logic* for unit
  tests. It is not proof generation and not a way to run the app.
