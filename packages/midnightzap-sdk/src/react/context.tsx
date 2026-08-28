import React, { createContext, useContext, useMemo } from "react";
import { MidnightZapClient } from "../core/client.js";
import { MockProofBackend } from "../core/mockBackend.js";
import type { ProofBackend } from "../core/types.js";

interface MidnightZapContextValue {
  client: MidnightZapClient;
  /** Fallback subject id for components that don't get an explicit one. */
  subjectId: string;
}

const MidnightZapContext = createContext<MidnightZapContextValue | null>(null);

export interface MidnightZapProviderProps {
  /**
   * Where proofs are produced. Defaults to an offline, deterministic
   * `MockProofBackend`, so `<MidnightZapProvider>` with no props is a
   * complete, working setup for local development and demos. Swap in
   * `new LiveMidnightBackend(...)` for a real Midnight network — nothing
   * below the provider changes.
   */
  backend?: ProofBackend;
  /**
   * A stable, non-identifying id for the current user/session that your
   * app already has (a hashed account id, a session token, ...). If you
   * omit it, MidnightZap derives a random per-tab id so components still
   * work with zero wiring. Individual components can always override it
   * with their own `subjectId` prop.
   */
  subjectId?: string;
  children: React.ReactNode;
}

/**
 * Wrap your app — or just the subtree that needs a privacy gate — once:
 *
 *   import { MidnightZapProvider } from "@midnightzap/sdk/react";
 *
 *   <MidnightZapProvider>
 *     <App />
 *   </MidnightZapProvider>
 *
 * That's the whole setup. Add `backend={new LiveMidnightBackend(...)}`
 * when you're ready to run against a real Midnight network.
 */
export function MidnightZapProvider({ backend, subjectId, children }: MidnightZapProviderProps) {
  const value = useMemo<MidnightZapContextValue>(() => {
    const resolvedBackend = backend ?? new MockProofBackend();
    return {
      client: new MidnightZapClient({ backend: resolvedBackend }),
      subjectId: subjectId ?? autoSubjectId(),
    };
  }, [backend, subjectId]);

  return <MidnightZapContext.Provider value={value}>{children}</MidnightZapContext.Provider>;
}

export function useMidnightZapClient(): MidnightZapClient {
  return useMidnightZapContext().client;
}

/** Resolve a subject id: explicit prop wins, else the provider fallback. */
export function useResolvedSubjectId(explicit?: string): string {
  const ctx = useMidnightZapContext();
  return explicit ?? ctx.subjectId;
}

function useMidnightZapContext(): MidnightZapContextValue {
  const ctx = useContext(MidnightZapContext);
  if (!ctx) {
    throw new Error(
      "MidnightZap components must be rendered inside <MidnightZapProvider>. " +
        "Wrap your app (or the relevant subtree) in one."
    );
  }
  return ctx;
}

const AUTO_ID_KEY = "midnightzap:auto-subject-id";

function autoSubjectId(): string {
  const fresh = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `mz-${crypto.randomUUID()}`
      : `mz-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

  if (typeof sessionStorage === "undefined") return fresh();
  try {
    const existing = sessionStorage.getItem(AUTO_ID_KEY);
    if (existing) return existing;
    const created = fresh();
    sessionStorage.setItem(AUTO_ID_KEY, created);
    return created;
  } catch {
    return fresh();
  }
}
