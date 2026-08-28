import React, { createContext, useContext, useMemo } from "react";
import { MidnightZapClient } from "../core/client.js";
import type { ProofBackend } from "../core/types.js";

const MidnightZapContext = createContext<MidnightZapClient | null>(null);

export interface MidnightZapProviderProps {
  backend: ProofBackend;
  children: React.ReactNode;
}

/**
 * Wrap your app (or just the part that needs a privacy gate) once:
 *
 *   import { MidnightZapProvider, MockProofBackend } from "@midnightzap/sdk/react";
 *
 *   <MidnightZapProvider backend={new MockProofBackend()}>
 *     <App />
 *   </MidnightZapProvider>
 *
 * Swap MockProofBackend for LiveMidnightBackend when you're ready to run
 * against a real Midnight network — nothing below this provider changes.
 */
export function MidnightZapProvider({ backend, children }: MidnightZapProviderProps) {
  const client = useMemo(() => new MidnightZapClient({ backend }), [backend]);
  return (
    <MidnightZapContext.Provider value={client}>{children}</MidnightZapContext.Provider>
  );
}

export function useMidnightZapClient(): MidnightZapClient {
  const client = useContext(MidnightZapContext);
  if (!client) {
    throw new Error(
      "useMidnightZapClient() called outside <MidnightZapProvider>. " +
        "Wrap your app (or the relevant subtree) in a MidnightZapProvider."
    );
  }
  return client;
}
