// AFTER — same forum, now with anonymous-but-verified posting. Posting
// still proves you're a real, current employee (no outsider spam), but the
// proof reveals only that fact, never which employee; a per-action
// nullifier stops one credential faking multiple "anonymous" posters.
// The whole integration: wrap the tree in <MidnightZapProvider> and put
// the composer inside <ProveMembership>; drop `author` from posts.
// Literal unified diff: docs/forum.diff.txt.

import React, { useState } from "react";
import { MidnightZapProvider, ProveMembership } from "@midzap/sdk/react";
import { InMemoryProofBackend } from "@midzap/sdk";
import { contracts } from "./midnight.js";

// See ecommerce-age-gate/src/App.tsx for why: the @midnight-ntwrk browser
// runtime doesn't bundle in stock Vite yet. Local preview runs the
// predicate logic in-browser; VITE_MZ_LIVE=1 uses the real backend.
const LIVE = Boolean((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_MZ_LIVE);
const backend = LIVE ? undefined : new InMemoryProofBackend();

// Stand-in for a credential this employee was already issued (e.g. at
// onboarding) and holds locally — never uploaded to the forum.
const localCredentialStore = { employeeCred: "cred_9f2a...redacted" };

interface Post {
  body: string;
}

function Forum() {
  const [draft, setDraft] = useState("");
  const [posts, setPosts] = useState<Post[]>([
    { body: "Can we revisit the return-to-office policy?" },
  ]);

  return (
    <div>
      <h1>Candid — Internal Feedback Forum</h1>
      <div className="card">
        <ProveMembership
          set="verified-employees"
          actionTag="post-access"
          getMemberSecret={() => localCredentialStore.employeeCred}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Share honest feedback..."
          />
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => {
                setPosts([{ body: draft }, ...posts]);
                setDraft("");
              }}
              disabled={!draft.trim()}
            >
              Post anonymously
            </button>
          </div>
        </ProveMembership>
      </div>

      {posts.map((p, i) => (
        <div className="post" key={i}>
          <small>Verified employee (identity hidden)</small>
          <p>{p.body}</p>
        </div>
      ))}
      <p style={{ fontSize: 13, color: "#666", marginTop: 12 }}>
        Candid can prove every post came from a real, current employee — and
        still never learns which one.
      </p>
    </div>
  );
}

export function App() {
  return (
    <MidnightZapProvider backend={backend} contracts={contracts} network="testnet">
      <Forum />
      {!LIVE && (
        <p style={{ fontSize: 12, color: "#999", marginTop: 20 }}>
          Local preview — predicate logic runs in-browser. Real Midnight
          proofs: see docs/GO_LIVE.md, then <code>VITE_MZ_LIVE=1</code>.
        </p>
      )}
    </MidnightZapProvider>
  );
}
