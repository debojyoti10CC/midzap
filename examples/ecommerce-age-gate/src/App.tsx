// AFTER — same checkout, now with a real zero-knowledge age gate instead of
// a self-reported checkbox. The whole integration: wrap the tree in
// <MidnightZapProvider> and put the gated button inside <ProveThreshold>.
// Nothing else changes. Literal unified diff: docs/ecommerce.diff.txt.

import React, { useState } from "react";
import { MidnightZapProvider, ProveThreshold } from "@midnightzap/sdk/react";

// Stand-in for however this app already knows the user's birth year
// (account profile, a previously-issued credential, etc). MidnightZap
// never asks for a document upload — it asks for a getter function.
const currentUser = { birthYear: 2000 };

function Checkout() {
  const [purchased, setPurchased] = useState(false);

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
            getPrivateValue={() => new Date().getFullYear() - currentUser.birthYear}
          >
            <button disabled={purchased} onClick={() => setPurchased(true)}>
              {purchased ? "Order placed" : "Complete purchase"}
            </button>
          </ProveThreshold>
        </div>
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
    <MidnightZapProvider>
      <Checkout />
    </MidnightZapProvider>
  );
}
