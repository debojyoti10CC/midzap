// AFTER — same refill flow, now with a zero-knowledge "credential valid"
// proof instead of a document upload. The customer proves their
// prescription was issued by a trusted prescriber and hasn't expired —
// the pharmacy never receives the document, the name, the prescriber, or
// the dates. The whole integration: wrap the tree in <MidnightZapProvider>
// and put the refill button inside <ProveCredentialValid>.
// Literal unified diff: docs/pharmacy.diff.txt.

import React, { useState } from "react";
import { MidnightZapProvider, ProveCredentialValid } from "@midnightzap/sdk/react";
import { contracts } from "./midnight.js";

// Stand-in for a signed prescription credential the customer already holds
// locally (issued by their doctor's system at prescribing time). Only its
// expiry timestamp is read, on-device, to build the proof.
const localCredentialStore = {
  prescription: { expiresAtUnix: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 120 },
};

function Refill() {
  const [refilled, setRefilled] = useState(false);

  return (
    <div>
      <h1>MeadowRx</h1>
      <div className="card">
        <p className="drug">Atorvastatin 20mg — 90 tablets</p>
        <p>Refill requires a valid, current prescription.</p>

        <div style={{ margin: "12px 0" }}>
          <ProveCredentialValid
            issuer="prescriber-registry"
            getExpiresAtUnix={() => localCredentialStore.prescription.expiresAtUnix}
          >
            <button disabled={refilled} onClick={() => setRefilled(true)}>
              {refilled ? "Refill requested" : "Request refill"}
            </button>
          </ProveCredentialValid>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "#666", marginTop: 12 }}>
        MeadowRx never sees your prescription document, your prescriber, or
        the dates on it — only a proof that a valid, unexpired one exists.
      </p>
    </div>
  );
}

export function App() {
  return (
    <MidnightZapProvider contracts={contracts} network="testnet">
      <Refill />
    </MidnightZapProvider>
  );
}
