# @midzap/sdk

**Add a Midnight zero-knowledge privacy gate to an existing app without writing Compact.**

Pick a predicate, hand it a getter for the private value, wrap the thing
you're gating. That's the integration.

```bash
npm install @midzap/sdk
```

## Integration

```tsx
import { MidnightZapProvider, ProveThreshold } from "@midzap/sdk/react";

function App() {
  return (
    <MidnightZapProvider network="testnet" contracts={{
      threshold: { address: "0x…", load: () => import("./managed/threshold/contract/index.js") },
    }}>
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
      <button>Complete purchase</button>   {/* revealed only after the proof verifies */}
    </ProveThreshold>
  );
}
```

No `useState`, no wallet code, no circuit in your app. The button appears
once a real zero-knowledge proof that `age ≥ 21` is verified on Midnight.
The birth year never leaves the browser.

The `contracts` addresses come from a one-time compile + deploy — see
**Real proofs on Midnight** at the bottom of this file. Until then, pass
`backend={new InMemoryProofBackend()}` for a working local preview.

## Three predicates

| Component | Proves | Private input (never transmitted) |
|---|---|---|
| `<ProveThreshold field threshold>` | a private number ≥ a public threshold | `getPrivateValue(): number` |
| `<ProveMembership set actionTag>` | caller is in a private set, not replayed for this action | `getMemberSecret(): string` |
| `<ProveCredentialValid issuer>` | a trusted-issuer credential that hasn't expired | `getExpiresAtUnix(): number` |

Every component takes the same optional props:

| Prop | Purpose |
|---|---|
| `children` | content revealed once verified (skip the manual `useState`) |
| `render={(state) => …}` | full custom UI; `state` has `status`, `verified`, `error`, `receipt`, `busy`, `run()` |
| `whileLocked` | node shown above the trigger before verification |
| `onVerified(receipt)` / `onRejected(reason)` / `onError(message)` | callbacks |
| `subjectId` | non-identifying session id; defaults to the provider's (auto-generated if unset) |
| `buttonLabel`, `disabled` | tweak the default trigger |
| `unstyled`, `className`, `style` | drop or extend the built-in inline styling |

## Styling

Components ship finished-looking inline styles — nothing to import. Theme
them by setting CSS variables on any ancestor:

```css
:root {
  --mz-accent: #6d28d9;
  --mz-ok: #0a7f43;
  --mz-error: #b3261e;
  --mz-radius: 10px;
}
```

Or pass `unstyled` and target the stable hooks: `.midnightzap-prove-threshold`,
`…__button`, `…__badge`, `…__error`, and `[data-status]`
(`idle` · `connecting-wallet` · `generating-proof` · `submitting` ·
`verified` · `rejected` · `error`).

## Backends

`LiveMidnightBackend` is the default — the provider builds it from your
`contracts` + `network`. It discovers the injected wallet, wires the
midnight-js providers, loads your compiled circuit, seeds its private state
on-device, calls it, and submits. See **Real proofs on Midnight** below.

`InMemoryProofBackend` evaluates the same accept/reject rules the circuits
enforce, offline and deterministically. Use it for unit tests and local UI
previews — pass it explicitly:

```ts
import { MidnightZapClient, InMemoryProofBackend } from "@midzap/sdk";

const client = new MidnightZapClient({ backend: new InMemoryProofBackend() });
const { verified } = await client.prove(
  { kind: "threshold", field: "age", threshold: 21 }, sessionId, { value: 25 },
);
// verified === true — asserts your predicate wiring, not a real proof
```

## Non-React usage

Drive `MidnightZapClient` directly with `LiveMidnightBackend`:

```ts
import { MidnightZapClient, LiveMidnightBackend } from "@midzap/sdk";

const client = new MidnightZapClient({
  backend: new LiveMidnightBackend({
    network: "testnet",
    bindings: {
      threshold: { address: "0x…", load: () => import("./managed/threshold/contract/index.js") },
    },
  }),
});
const { verified, receipt } = await client.prove(
  { kind: "threshold", field: "age", threshold: 21 }, sessionId, { value: 25 },
);
```

## Real proofs on Midnight

`InMemoryProofBackend` gets you a working gate immediately. To produce real
zero-knowledge proofs on a Midnight network:

**1. Peer dependencies**

```bash
npm i @midnight-ntwrk/compact-runtime @midnight-ntwrk/dapp-connector-api \
  @midnight-ntwrk/midnight-js-contracts @midnight-ntwrk/midnight-js-types \
  @midnight-ntwrk/midnight-js-level-private-state-provider \
  @midnight-ntwrk/midnight-js-indexer-public-data-provider \
  @midnight-ntwrk/midnight-js-http-client-proof-provider \
  @midnight-ntwrk/midnight-js-fetch-zk-config-provider
```

Plus a Midnight-compatible wallet (Lace, TestNet) and tDUST from the
faucet.

**2. Compile + deploy the predicate circuit**

The `compact/` templates compile with the `compact` toolchain (0.34.x).
Deploy each once with your Midnight deploy flow; keep the addresses.
`threshold` is fully private from `getPrivateValue` alone. `membership` and
`credential-valid` need extra witness material passed via `getExtraWitness`
(the Merkle path / the signed-credential fields).

**3. Bundling for the browser**

`@midnight-ntwrk/compact-runtime` pulls a Rust→WASM runtime and the indexer
provider uses `isomorphic-ws`. A stock bundler can't handle this — you need
`vite-plugin-wasm`, `vite-plugin-top-level-await`, `vite-plugin-node-polyfills`,
and a `WebSocket` alias for `isomorphic-ws`. The simplest path is to start
from a current Midnight example dApp's build config.

**4. Point the provider at your contracts**

```tsx
<MidnightZapProvider network="testnet" contracts={{
  threshold:          { address: "0x…", load: () => import("./managed/threshold/contract/index.js") },
  membership:         { address: "0x…", load: () => import("./managed/membership/contract/index.js") },
  "credential-valid": { address: "0x…", load: () => import("./managed/expiry/contract/index.js") },
}}>
```

Same three addresses and compiled params for every app after the first.

---

MIT licensed. Part of the [MidnightZap](https://github.com/debojyoti10CC/midzap) monorepo.
