<div align="center">

# MidnightZap — zero-knowledge privacy in your app in minutes

<img width="1200" height="675" alt="Bring" src="https://github.com/user-attachments/assets/4637d774-de30-4691-b0be-c678db5e0417" />

[![@midzap/sdk](https://img.shields.io/npm/v/@midzap/sdk?label=%40midzap%2Fsdk&color=16213e)](https://www.npmjs.com/package/@midzap/sdk)
[![@midzap/cli](https://img.shields.io/npm/v/@midzap/cli?label=%40midzap%2Fcli&color=16213e)](https://www.npmjs.com/package/@midzap/cli)
[![license](https://img.shields.io/npm/l/@midzap/sdk?color=0a7f43)](LICENSE)
[![node](https://img.shields.io/node/v/@midzap/sdk)](https://nodejs.org)

</div>

---

The complete privacy toolkit for your web2 app — **private threshold checks**
(age, income, score, balance), **anonymous-but-verified membership** with
**anti-replay nullifiers**, **credential-validity / expiry proofs**, a
**pluggable proof backend** (real Midnight network or offline preview),
compiled **Compact circuits shipped in the box**, and a **one-command
codemod CLI** that rewrites an existing app to use all of it — all behind a
TypeScript SDK.

Your app never touches Compact, a ZK circuit, or the wallet stack. It picks
a predicate, hands over a getter for the private value, and gets a working
zero-knowledge gate.

Works on **web** — React + Vite, Next.js, CRA. The CLI runs against any
React/TypeScript project.

- **CLI reference:** [`packages/midnightzap-cli/README.md`](packages/midnightzap-cli/README.md)
- **SDK reference:** [`packages/midnightzap-sdk/README.md`](packages/midnightzap-sdk/README.md)
- **Architecture:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Going live on Midnight:** [`docs/GO_LIVE.md`](docs/GO_LIVE.md)
- **Demo-video script:** [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)

---

## The pitch, in one command

```bash
npx @midzap/cli add age-gate ./my-shop --dry-run
```

It finds the self-reported control that gates an action — an "I am 21+"
checkbox, a licence upload, a real-name login — and prints the exact diff
that turns it into a zero-knowledge gate: the component swapped for a
`<Prove…>`, the app root wrapped in `<MidnightZapProvider>`, a compiled
circuit + binding dropped in, the Vite config patched. Drop `--dry-run` to
apply it.

---

## Installation

```bash
npm install @midzap/sdk        # the SDK
npx  @midzap/cli --help        # the codemod CLI (no install needed)
```

or

```bash
yarn add @midzap/sdk
```

### Dependencies

The SDK **core has zero runtime dependencies.** Everything else is an
**optional peer dependency** — install only what a given feature needs.

| Feature | Peer dependencies |
| --- | --- |
| **SDK core** — predicate components, offline preview backend | *none* |
| **React layer** — `<MidnightZapProvider>`, `<Prove…>`, hooks | `react@>=18` |
| **Live proofs on Midnight** (`LiveMidnightBackend`, the default) | `@midnight-ntwrk/compact-runtime`, `@midnight-ntwrk/dapp-connector-api`, `@midnight-ntwrk/midnight-js-contracts`, `@midnight-ntwrk/midnight-js-types`, `@midnight-ntwrk/midnight-js-level-private-state-provider`, `@midnight-ntwrk/midnight-js-indexer-public-data-provider`, `@midnight-ntwrk/midnight-js-http-client-proof-provider`, `@midnight-ntwrk/midnight-js-fetch-zk-config-provider` |
| **Bundling the live stack for a browser** | `vite-plugin-wasm`, `vite-plugin-top-level-await`, `vite-plugin-node-polyfills` |
| **Compiling / editing the circuits** | the [`compact`](https://docs.midnight.network) toolchain (0.34.x) |

```bash
# Live proofs on Midnight
npm install @midnight-ntwrk/compact-runtime @midnight-ntwrk/dapp-connector-api \
  @midnight-ntwrk/midnight-js-contracts @midnight-ntwrk/midnight-js-types \
  @midnight-ntwrk/midnight-js-level-private-state-provider \
  @midnight-ntwrk/midnight-js-indexer-public-data-provider \
  @midnight-ntwrk/midnight-js-http-client-proof-provider \
  @midnight-ntwrk/midnight-js-fetch-zk-config-provider

# Browser build of the live stack
npm install -D vite-plugin-wasm vite-plugin-top-level-await vite-plugin-node-polyfills
```

Full walkthrough: [`docs/GO_LIVE.md`](docs/GO_LIVE.md).

---

## Quick Start

### Wire a gate by hand

```tsx
import { MidnightZapProvider, ProveThreshold } from "@midzap/sdk/react";

function App() {
  return (
    <MidnightZapProvider
      network="testnet"
      contracts={{
        threshold: {
          address: "0xYOUR_DEPLOYED_CONTRACT",
          load: () => import("./managed/threshold/contract/index.js"),
        },
      }}
    >
      <Checkout />
    </MidnightZapProvider>
  );
}

function Checkout() {
  return (
    <ProveThreshold
      field="age"
      threshold={21}
      getPrivateValue={() => new Date().getFullYear() - user.birthYear}
    >
      <button>Complete purchase</button>   {/* revealed only once the proof verifies */}
    </ProveThreshold>
  );
}
```

No `useState`, no wallet code, no circuit in your app. The store never sees
a birth date, an ID, or an exact age — only a cryptographic proof that
`age ≥ 21`.

### Or let the CLI do it

```bash
npx @midzap/cli add age-gate ./my-shop     # + credential-check, anon-login
```

---

## Predicates

| CLI recipe | Component | Proves | Private input (never transmitted) |
| --- | --- | --- | --- |
| `age-gate` | `<ProveThreshold field threshold>` | a private number ≥ a public threshold | `getPrivateValue(): number` |
| `anon-login` | `<ProveMembership set actionTag>` | caller ∈ a private set, and not replayed for this action (nullifier) | `getMemberSecret(): string` |
| `credential-check` | `<ProveCredentialValid issuer>` | a trusted-issuer credential that hasn't expired | `getExpiresAtUnix(): number` |

Every component takes the same optional props: `children` (revealed on
verify), `render={(state) => …}` (full custom UI), `whileLocked`,
`onVerified` / `onRejected` / `onError`, `subjectId`, `buttonLabel`,
`disabled`, and `unstyled` / `className` / `style`. Theme the whole SDK
with CSS variables — `--mz-accent`, `--mz-ok`, `--mz-error`, `--mz-radius`.

---

## Backends

One interface, `ProofBackend`:

- **`LiveMidnightBackend`** *(default)* — discovers the injected
  `window.midnight` wallet, builds the midnight-js providers (proof server,
  indexer, private-state, zk-config), loads your compiled circuit, seeds
  its private state on-device, calls the circuit, submits, returns the tx
  id. Configured from the provider's `contracts` / `network` props.
- **`InMemoryProofBackend`** — evaluates the *same accept/reject logic* the
  circuits enforce, deterministically and with no network. For unit tests
  and local UI previews — pass it explicitly. Not a proof.

Swapping between them changes one prop. Nothing else in the app changes.

---

## Repository layout

```
packages/midnightzap-cli/     Codemod CLI — recipes: age-gate / anon-login / credential-check
packages/midnightzap-sdk/     SDK — framework-agnostic core + React layer + backends
compact/                      Three Compact circuit templates + NOTES.md (compile log)
examples/plain-shop/          A pristine web2 checkout — the CLI's "before"
examples/ecommerce-age-gate/  BEFORE/AFTER: checkbox age-gate → ProveThreshold
examples/forum-anon-login/    BEFORE/AFTER: real-name login → ProveMembership
examples/pharmacy-refill/     BEFORE/AFTER: prescription upload → ProveCredentialValid
scripts/cli-e2e.mjs           Runs the CLI on plain-shop, builds the result, restores it
scripts/smoke-test.mjs        Predicate accept/reject logic test
scripts/deploy.mjs            One-time deploy of the three predicate contracts
docs/                         GO_LIVE · ARCHITECTURE · DEMO_SCRIPT · *.diff.txt
```

---

## Status

The tooling is real and tested. `npm install && npm run verify` builds the
SDK + CLI, typechecks six workspaces, runs the predicate-logic test, and
runs an **end-to-end test that converts a plain web2 app with the CLI and
compiles the result**.

- **Circuits** — all three compile with the `compact` toolchain **0.34.0**;
  the compiled output is checked in, so the repo runs without the toolchain.
  `compact/NOTES.md` logs the fixes the first compile needed.
- **`threshold`** proves `value ≥ threshold` with the value fully private.
  **`membership`** and **`expiry`** ship a **v1**: the check is against an
  on-chain `Set` / `Map`, which is pseudonymous (repeat actions by one
  member link). The fully-anonymous Merkle versions and the upgrade path are
  in `compact/NOTES.md`.
- **Live, in a browser** — `LiveMidnightBackend` is complete
  (wallet discovery → providers → circuit call → submit), but the
  `@midnight-ntwrk` runtime is WASM + top-level-await and does not bundle in
  a stock Vite app. `docs/GO_LIVE.md` covers the deploy + Vite setup; until
  then the examples run their predicate logic in-browser as a preview
  (`VITE_MZ_LIVE=1` switches to the real backend, no code change).

---

## Contributing

```bash
npm install
npm run verify        # build + typecheck + smoke test + CLI e2e + diff-drift
npm run dev           # run the age-gate example (http://localhost:5173)
```

Regenerate the before/after diffs after editing an example:
`npm run gen:diffs`.

---

## License

[MIT](LICENSE)
