# @midnightzap/sdk

**Add a Midnight zero-knowledge privacy gate to an existing app without writing Compact.**

Pick a predicate, hand it a getter for the private value, wrap the thing
you're gating. That's the integration.

```bash
npm install @midnightzap/sdk
```

## 60-second integration

```tsx
import { MidnightZapProvider, ProveThreshold } from "@midnightzap/sdk/react";

function App() {
  return (
    <MidnightZapProvider>            {/* no props = offline mock backend */}
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

No `useState`, no wallet code, no circuit. The button appears once a
zero-knowledge proof that `age ≥ 21` is verified. The birth year never
leaves the browser.

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

## Going live on a real Midnight network

```tsx
import { LiveMidnightBackend } from "@midnightzap/sdk";

<MidnightZapProvider backend={new LiveMidnightBackend({ network: "testnet" })}>
```

Nothing below the provider changes. The default `MockProofBackend` runs the
same accept/reject logic the Compact circuits enforce, entirely offline, so
development and demos need no wallet, faucet, or deployed contract.

## Non-React usage

```ts
import { MidnightZapClient, MockProofBackend } from "@midnightzap/sdk";

const client = new MidnightZapClient({ backend: new MockProofBackend() });
const result = await client.prove(
  { kind: "threshold", field: "age", threshold: 21 },
  sessionId,
  { value: 25 },
);
// result.verified === true
```

MIT licensed. Part of the [MidnightZap](https://github.com/midnightzap/midnightzap) monorepo.
