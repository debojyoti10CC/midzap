# Demo video script (target: 1:50, hard cap 2:00)

**Before recording:** decide your honesty framing. The CLI conversion and
build are fully real. The *running* proof is a local preview unless you've
finished `docs/GO_LIVE.md` (deploy + Vite WASM setup) and run with
`VITE_MZ_LIVE=1`. Say which one you're showing; never call a preview a real
on-chain proof.

Required opening line, on camera, first:

> "Hey, I'm [name] and this is my demo for the Midnight Hackathon."

## 0:00–0:15 — The hook (screen: a terminal + a plain web2 app in the browser)

> "Every new chain has the same problem — nobody wants to rewrite their app
> for it. MidnightZap fixes that with one command. Here's a completely
> ordinary web2 wine shop: age 'verification' is a checkbox that proves
> nothing. Watch me make it actually private."

## 0:15–0:50 — The conversion (screen: terminal, full-screen)

- Run: `npx @midnightzap/cli add age-gate ./plain-shop --dry-run`
- The diff prints: **one import**, the `<input type="checkbox">` block
  swapped for `<ProveThreshold field="age" threshold={21}>`, the app root
  wrapped in `<MidnightZapProvider>`, `vite.config` patched, a
  `src/midnight.ts` binding + the compiled circuit copied in.
- Say: "That's the whole integration — and it's a diff I review, not a
  rewrite. Apply it."
- Run it for real (drop `--dry-run`), then `npm install`.

## 0:50–1:15 — It runs (screen: browser)

- `npm run dev` → the shop. The checkbox is gone; there's a "Prove age ≥ 21
  privately" button.
- Click it → status cycles (connecting → generating proof → submitting) →
  the "Complete purchase" button it was gating appears.
- Say: "The store never sees a birthdate, an ID, or your exact age — only a
  zero-knowledge proof the threshold was met."
  *(If preview:)* "This is running the predicate logic in-browser; the same
  code path, backed by the real Midnight backend, is one env var away."

## 1:15–1:35 — Not a one-trick (screen: `midnightzap list`, then the repo)

- `npx @midnightzap/cli list` — `age-gate`, `anon-login`, `credential-check`.
- Flash the three before/after example diffs (`docs/*.diff.txt`): "Same
  move for an anonymous-but-verified forum login, and a 'prescription still
  valid' check with no document upload."
- Flash `compact/` — "Three real Compact circuits, compiled with the 0.34
  toolchain. Your app never touches them."

## 1:35–1:50 — Close (screen: README)

> "MidnightZap turns 'integrate Midnight' into `npx`, then a pull request.
> That's the before, that's the after — thanks for watching."

## Prep checklist

- [ ] `packages/midnightzap-cli` and `@midnightzap/sdk` built
      (`npm run build:sdk build:cli`), a **pristine** copy of
      `examples/plain-shop` ready to convert on camera.
- [ ] Terminal font large; `--dry-run` output fits without scrolling.
- [ ] `docs/*.diff.txt` open in an editor tab.
- [ ] Say the required opening line first, unedited. Keep it under 2:00.
