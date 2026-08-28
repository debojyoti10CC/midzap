// AFTER — same forum, now with anonymous-but-verified posting. Posting
// still proves you're a real, current employee (no outsider spam), but the
// proof reveals only that fact, never which employee; a per-action
// nullifier stops one credential faking multiple "anonymous" posters.
// The whole integration: swap real-name login for <ProveMembership>, wrap
// the tree in <MidnightZapProvider>, drop `author` from posts. Literal
// unified diff: docs/forum.diff.txt.

import React, { useState } from "react";
import { MidnightZapProvider, ProveMembership } from "@midnightzap/sdk/react";
import { MockProofBackend } from "@midnightzap/sdk";

// In production, swap MockProofBackend for LiveMidnightBackend — see
// packages/midnightzap-sdk/src/core/liveBackend.ts. Nothing below changes.
const backend = new MockProofBackend();

// Stand-in for a credential this employee was already issued (e.g. at
// onboarding) and holds locally — never uploaded to the forum.
const localCredentialStore = { employeeCred: "cred_9f2a...redacted" };

interface Post {
  body: string;
}

function Forum() {
  const [verified, setVerified] = useState(false);
  const [draft, setDraft] = useState("");
  const [posts, setPosts] = useState<Post[]>([
    { body: "Can we revisit the return-to-office policy?" },
  ]);

  return (
    <div>
      <h1>Candid — Internal Feedback Forum</h1>
      <div className="card">
        {!verified ? (
          <ProveMembership
            set="verified-employees"
            actionTag="post-access"
            subjectId="demo-session-1"
            getMemberSecret={() => localCredentialStore.employeeCred}
            onVerified={() => setVerified(true)}
          />
        ) : (
          <>
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
          </>
        )}
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
    <MidnightZapProvider backend={backend}>
      <Forum />
    </MidnightZapProvider>
  );
}
