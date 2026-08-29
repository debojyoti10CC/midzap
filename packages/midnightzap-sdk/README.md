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

The `contracts` addresses come from a one-time `compactc` compile + deploy —
see [GO_LIVE.md](https://github.com/debojyoti10CC/midzap/blob/main/docs/GO_LIVE.md).
Also install the `@midnight-ntwrk/*` peer deps listed there.

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
on-device, calls it, and submits. Setup: **GO_LIVE.md**.

`InMemoryProofBackend` evaluates the same accept/reject rules the circuits
enforce, offline and deterministically. **Unit tests only** — pass it
explicitly, never ship it:

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

MIT licensed. Part of the [MidnightZap](https://github.com/debojyoti10CC/midzap) monorepo.
