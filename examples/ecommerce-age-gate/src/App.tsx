// AFTER — same checkout, now with a real zero-knowledge age gate instead of
// a self-reported checkbox. The whole integration: swap the checkbox for
// <ProveThreshold>, wrap the tree in <MidnightZapProvider>. Nothing else
// changes. Literal unified diff: docs/ecommerce.diff.txt.

import React, { useState } from "react";
import { MidnightZapProvider, ProveThreshold } from "@midnightzap/sdk/react";
import { MockProofBackend } from "@midnightzap/sdk";

// In production, swap MockProofBackend for LiveMidnightBackend — see
// packages/midnightzap-sdk/src/core/liveBackend.ts. Nothing below changes.
const backend = new MockProofBackend();

// Stand-in for however this app already knows the user's birth year
// (account profile, a previously-issued credential, etc). MidnightZap
// never asks for a document upload — it asks for a getter function.
const currentUser = { birthYear: 2000 };

function Checkout() {
  const [purchased, setPurchased] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  return (
    <div>
      <h1>Vino & Co.</h1>
      <div className="card">
        <p>2021 Willamette Valley Pinot Noir</p>
        <p className="price">$34.00</p>

        <div style={{ margin: "12px 0" }}>
          <ProveThreshold
            field="age"
            threshold={21}
            subjectId="demo-session-1"
            getPrivateValue={() => new Date().getFullYear() - currentUser.birthYear}
            onVerified={() => setUnlocked(true)}
          />
        </div>

        <button disabled={!unlocked || purchased} onClick={() => setPurchased(true)}>
          {purchased ? "Order placed" : "Complete purchase"}
        </button>
      </div>
      <p style={{ fontSize: 13, color: "#666", marginTop: 12 }}>
        Vino & Co. never sees your birth date, ID, or exact age — only a
        zero-knowledge proof that you're 21+.
      </p>
    </div>
  );
}

export function App() {
  return (
    <MidnightZapProvider backend={backend}>
      <Checkout />
    </MidnightZapProvider>
  );
}
