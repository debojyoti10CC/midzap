// BEFORE — an ordinary web2 checkout. "Age verification" is a self-reported
// checkbox, which proves nothing. Not wired into the Vite build; it's the
// "before" half of the story. Diff vs App.tsx: docs/ecommerce.diff.txt.

import React, { useState } from "react";

export function App() {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [purchased, setPurchased] = useState(false);

  return (
    <div>
      <h1>Vino & Co.</h1>
      <div className="card">
        <p>2021 Willamette Valley Pinot Noir</p>
        <p className="price">$34.00</p>

        <label style={{ display: "block", margin: "12px 0" }}>
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
          />{" "}
          I confirm I am 21 or older
        </label>

        <button disabled={!ageConfirmed || purchased} onClick={() => setPurchased(true)}>
          {purchased ? "Order placed" : "Complete purchase"}
        </button>
      </div>
    </div>
  );
}
