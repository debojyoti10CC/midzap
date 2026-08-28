# Demo video script (target: 1:50, hard cap 2:00)

Required opening line per the hackathon rules — say this exactly, on camera,
first:

> "Hey, I'm [name] and this is my demo for the Midnight Hackathon."

## 0:00–0:15 — The hook (screen: split view, two phones/tabs side by side)

> "Every new blockchain has the same problem: nobody wants to rewrite their
> app to use it. So we built MidnightZap — a drop-in SDK that adds real,
> Midnight-powered zero-knowledge privacy to an *existing* web2 app in
> minutes, not months. Watch."

## 0:15–0:45 — Integration 1: e-commerce age gate (screen: code editor + browser)

- Show `App.before.tsx`: a wine checkout with a plain "I confirm I'm 21+"
  checkbox. Say: "This is what basically every e-commerce site does today —
  a checkbox. It proves nothing."
- Cut to the diff (`docs/ecommerce.diff.txt`) scrolling — the real change
  is a checkbox swapped for one `<ProveThreshold>` component plus a
  `<MidnightZapProvider>` wrapper; the rest is comments and copy.
- Cut to the running app (`npm run dev:ecommerce`): click "Prove age ≥ 21
  privately," watch the button cycle through connecting → generating proof
  → submitting, then the "Complete purchase" button it was gating appears
  in its place.
- Say: "The store never sees a birthdate, an ID, or your exact age — just a
  cryptographic proof the threshold was met."

## 0:45–1:15 — Integration 2: anonymous verified forum (screen: code editor + browser)

- Show `App.before.tsx`: real-name login, posts tied to a real employee
  name forever.
- Cut to the diff (`docs/forum.diff.txt`).
- Cut to the running app (`npm run dev:forum`): click "Verify membership...
  anonymously," the composer it was gating appears, post as "Verified
  employee (identity hidden)."
- Say: "It's still provably a real, current employee — the forum just never
  learns which one. And a nullifier stops that same credential from posting
  twice under the same thread pretending to be different people."

## 1:15–1:35 — Under the hood (screen: `/compact` folder + `liveBackend.ts`)

- Briefly show the three `.compact` predicate templates.
- Say: "Both integrations sit on the same three predicate templates — a
  threshold check, a membership check with an anti-replay nullifier, and a
  credential-expiry check. Ship a new privacy feature by picking a
  predicate, not writing a circuit."
- Flash the mock-vs-live backend swap (one line: `MockProofBackend` →
  `LiveMidnightBackend`) to show the path to a real Midnight network
  deployment.

## 1:35–1:50 — Close (screen: README / architecture)

> "MidnightZap turns 'integrate Midnight' from a research project into a
> pull request. That's the before, that's the after, thanks for watching."

## Shot list / prep checklist

- [ ] Record with `npm run dev:ecommerce` and `npm run dev:forum` both
      already running so there's no boot-time dead air.
- [ ] Have `docs/ecommerce.diff.txt` and `docs/forum.diff.txt` open in an
      editor tab, pre-scrolled to the top.
- [ ] Say the exact required opening line first, unedited.
- [ ] Keep total runtime under 2:00 — this script is paced to ~1:50 to leave
      margin.
