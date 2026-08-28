// BEFORE — an online pharmacy refill flow. To refill, you upload a photo of
// your paper prescription, which the pharmacy stores: it now holds an image
// of a medical document with your name, drug, prescriber, and dates on it.
// Not wired into the Vite build; it's the "before" half of the story.
// Diff vs App.tsx: docs/pharmacy.diff.txt.

import React, { useState } from "react";

export function App() {
  const [file, setFile] = useState<File | null>(null);
  const [refilled, setRefilled] = useState(false);

  return (
    <div>
      <h1>MeadowRx</h1>
      <div className="card">
        <p className="drug">Atorvastatin 20mg — 90 tablets</p>
        <p>Refill requires a valid, current prescription.</p>

        <label style={{ display: "block", margin: "12px 0" }}>
          Upload a photo of your prescription:{" "}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <button disabled={!file || refilled} onClick={() => setRefilled(true)}>
          {refilled ? "Refill requested" : "Request refill"}
        </button>
      </div>
    </div>
  );
}
