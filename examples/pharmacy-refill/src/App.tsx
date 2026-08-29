// A pharmacy refill flow with a zero-knowledge "credential valid"
// proof instead of a document upload. The customer proves their
// prescription was issued by a trusted prescriber and hasn't expired —
// the pharmacy never receives the document, the name, the prescriber, or
// the dates. The whole integration: wrap the tree in <MidnightZapProvider>
// and put the refill button inside <ProveCredentialValid>.

import React, { useState } from "react";
import { MidnightZapProvider, ProveCredentialValid } from "@midzap/sdk/react";
import { InMemoryProofBackend } from "@midzap/sdk";
import { contracts } from "./midnight.js";

// vite.config.ts bundles the real @midnight-ntwrk runtime; this still
// defaults to InMemoryProofBackend (no wallet / deployed contract needed).
// Run with VITE_MZ_LIVE=1 once you have both.
const LIVE = Boolean((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_MZ_LIVE);
const backend = LIVE ? undefined : new InMemoryProofBackend();

// Stand-in for a prescription credential the customer already holds locally
// (issued by their doctor's system at prescribing time). `hash` is a
// one-way hash of the credential — registered on-chain by the issuer with
// its expiry. Nothing here is the document, the name, or the dates.
const localCredentialStore = {
  prescription: {
    hash: "9f2a4c1e8b7d6a5f0c3e2d1b4a6f8c7e9d0b1a2c3e4d5f6a7b8c9d0e1f2a3b4c",
    expiresAtUnix: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 120,
  },
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
            getExtraWitness={() => ({ credentialHash: localCredentialStore.prescription.hash })}
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
    <MidnightZapProvider backend={backend} contracts={contracts} network="testnet">
      <Refill />
      {!LIVE && (
        <p style={{ fontSize: 12, color: "#999", marginTop: 20 }}>
          Local preview — predicate logic runs in-browser. Real Midnight
          proofs: see the @midzap/sdk README, then <code>VITE_MZ_LIVE=1</code>.
        </p>
      )}
    </MidnightZapProvider>
  );
}
