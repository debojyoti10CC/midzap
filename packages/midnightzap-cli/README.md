# @midzap/cli

**Turn an existing web2 React app into a Midnight zero-knowledge privacy app — one command.**

```bash
npx @midzap/cli add age-gate ./my-shop
```

It finds the self-reported control that gates an action (an age checkbox, a
file upload, a real-name login), rewrites it as a MidnightZap predicate
component, wraps your app root in `<MidnightZapProvider>`, drops in the
compiled Compact circuit + a `midnight.ts` binding, and patches your Vite
config for the Midnight runtime.

## Recipes

| Recipe | Finds | Rewrites to |
|---|---|---|
| `age-gate` | `<input type="checkbox">` ("I am 21+") gating a button | `<ProveThreshold field="age" threshold={21}>` |
| `credential-check` | `<input type="file">` (upload your licence/Rx) gating a button | `<ProveCredentialValid issuer=…>` |
| `anon-login` | a `{loggedIn ? … : <button>Log in…</button>}` branch | `<ProveMembership set=… actionTag="login">` |

## Commands

```
npx @midzap/cli add <recipe> [dir]   apply a recipe (default dir: .)
npx @midzap/cli list                 list recipes
npx @midzap/cli doctor [dir]         check an integrated project

  --dry-run   print the diff, write nothing
  --yes, -y   skip confirmation
```

## What `add` changes

1. **your gated component** — the self-reported control → a `<Prove…>` gate,
   with the `disabled={!confirmed}` guard removed.
2. **your app root** — wrapped in `<MidnightZapProvider>`.
3. **`src/midnight.ts`** *(new)* — the contract binding. Add your deployed
   address here.
4. **`src/managed/<circuit>/`** *(new)* — the compiled Compact circuit + zk
   params, ready to serve.
5. **`vite.config.*`** — marks the `@midnight-ntwrk` WASM runtime external
   so the app builds.
6. **`package.json`** — adds `@midzap/sdk`.

Run `--dry-run` first to see all of it as a diff.

## After conversion

The app runs immediately in a **local preview** (the predicate logic runs
in-browser). For real proofs on Midnight: deploy the circuit, set the
address in `src/midnight.ts`, finish the Vite setup, and run with
`VITE_MZ_LIVE=1`. See
[the @midzap/sdk README](https://www.npmjs.com/package/@midzap/sdk).
