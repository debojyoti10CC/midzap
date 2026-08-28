# Going live — real proofs on Midnight

MidnightZap defaults to `LiveMidnightBackend`. There is no mock in the
running-app path. This is the one-time setup that turns the wiring into
working zero-knowledge proofs. Budget ~half a day the first time; every app
after that is ~5 minutes (last section).

## 0. Prerequisites

| Tool | Why | Get it |
|---|---|---|
| `compactc` | compiles the `.compact` circuits | docs.midnight.network → *Compact compiler* install script |
| Lace (Midnight preview) | wallet + injected connector | Chrome Web Store; switch to **TestNet** |
| tDUST | pays for deploy + proof txs | `faucet.testnet.midnight.network` |
| Proof server | generates proofs client-side | bundled with Lace, or `docker run -p 6300:6300 midnightnetwork/proof-server` |

Install the SDK's optional peer deps in your app:

```bash
npm i @midnight-ntwrk/midnight-js-contracts \
      @midnight-ntwrk/midnight-js-types \
      @midnight-ntwrk/midnight-js-level-private-state-provider \
      @midnight-ntwrk/midnight-js-indexer-public-data-provider \
      @midnight-ntwrk/midnight-js-http-client-proof-provider \
      @midnight-ntwrk/midnight-js-fetch-zk-config-provider \
      @midnight-ntwrk/dapp-connector-api
```

## 1. Compile the circuits

```bash
compactc compile compact/threshold_proof.compact   examples/ecommerce-age-gate/src/managed/threshold
compactc compile compact/membership_proof.compact  examples/forum-anon-login/src/managed/membership
compactc compile compact/expiry_proof.compact      examples/pharmacy-refill/src/managed/expiry
```

**Expect errors on the first pass.** The templates have never been through
`compactc`. `compact/NOTES.md` lists the specific spots most likely to
need a fix, in the order the compiler hits them (the `0.23` pragma,
`verifySignature`, `disclose` on public args, Merkle helper signatures).
The compiled output replaces the checked-in placeholder
`managed/**/index.cjs` files (which only exist so the repo builds).

The zk-params get copied into each example's `public/` automatically by a
`predev` / `prebuild` hook (`scripts/sync-managed.mjs`) — no manual copy
step. Run it by hand any time with `npm run sync:managed -w ecommerce-age-gate`.

## 2. Deploy once

Fill a provider context and run:

```bash
node scripts/deploy.mjs
# threshold: 0x…
# membership: 0x…
# credential-valid: 0x…
```

You deploy **once**. Every app reuses these addresses.

## 3. Paste the addresses

In each example's `src/midnight.ts`, replace the `0xREPLACE_…` constant with
the address from step 2. Done — `npm run dev:ecommerce` now produces real
proofs.

## 4. The two circuits that need extra witness material

`threshold` works end-to-end from `getPrivateValue` alone. The other two
need private data the component doesn't model:

```tsx
<ProveMembership
  set="verified-employees" actionTag="post-access"
  getMemberSecret={() => cred.secret}
  getExtraWitness={() => ({ merklePath: treeService.pathFor(cred.secret) })}
/>

<ProveCredentialValid
  issuer="prescriber-registry"
  getExpiresAtUnix={() => rx.expiresAt}
  getExtraWitness={() => ({
    issuerPublicKey: rx.issuerPk,
    issuerSignature: rx.issuerSig,
    credentialHash: rx.hash,
  })}
/>
```

`getExtraWitness` runs on-device and is merged into the private input; none
of it is transmitted.

## Incorporating into any other app (the ~5-minute part)

```bash
npm i @midnightzap/sdk
# compile the templates into src/managed/ (once), then copy to public/:
cp -r src/managed public/
```

```tsx
import { MidnightZapProvider, ProveThreshold } from "@midnightzap/sdk/react";

<MidnightZapProvider contracts={{
  threshold:          { address: "0x…", load: () => import("./managed/threshold/contract/index.cjs") },
  membership:         { address: "0x…", load: () => import("./managed/membership/contract/index.cjs") },
  "credential-valid": { address: "0x…", load: () => import("./managed/expiry/contract/index.cjs") },
}} network="testnet">
  <App />
</MidnightZapProvider>

// anywhere inside:
<ProveThreshold field="age" threshold={21}
  getPrivateValue={() => new Date().getFullYear() - user.birthYear}>
  <CheckoutButton />
</ProveThreshold>
```

Same three addresses, same compiled params. Real proofs, no mock.

## Testing without a network

`InMemoryProofBackend` (exported from `@midnightzap/sdk`) evaluates the same
accept/reject rules the circuits enforce, deterministically and offline.
Use it in unit tests only — pass it explicitly as `backend`. It is not a
way to run the app, and it does not generate proofs.
