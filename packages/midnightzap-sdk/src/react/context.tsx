import React, { createContext, useContext, useMemo } from "react";
import { MidnightZapClient } from "../core/client.js";
import { LiveMidnightBackend } from "../core/liveBackend.js";
import type { ContractBindings, ProofBackend } from "../core/types.js";

interface MidnightZapContextValue {
  client: MidnightZapClient;
  /** Fallback subject id for components that don't get an explicit one. */
  subjectId: string;
}

const MidnightZapContext = createContext<MidnightZapContextValue | null>(null);

export interface MidnightZapProviderProps {
  /**
   * Where proofs are produced. Defaults to `LiveMidnightBackend` — real
   * wallet, real Compact contracts, real Midnight proofs. Pass `contracts`
   * (below) to point it at your deployed predicate contracts. Only override
   * `backend` directly for tests (with `InMemoryProofBackend`) or a custom
   * `ProofBackend`.
   */
  backend?: ProofBackend;
  /**
   * Deployed predicate contracts, keyed by predicate kind. Each entry is
   * `{ address, load }` where `load` imports that circuit's `compactc`
   * output:
   *
   *   contracts={{
   *     threshold: { address: "0x…", load: () => import("./managed/threshold/contract/index.cjs") },
   *   }}
   *
   * Ignored when `backend` is set. See docs/GO_LIVE.md.
   */
  contracts?: ContractBindings;
  /** Passed to the default `LiveMidnightBackend`. Informational. */
  network?: string;
  /** Base URL the browser fetches compiled `managed/<circuit>/` zk-params from. */
  zkAssetsBaseUrl?: string;
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
 *   <MidnightZapProvider contracts={{
 *     threshold: { address: "0x…", load: () => import("./managed/threshold/contract/index.cjs") },
 *   }}>
 *     <App />
 *   </MidnightZapProvider>
 *
 * Real proofs against Midnight. The one-time compile + deploy that
 * produces those addresses is in docs/GO_LIVE.md.
 */
export function MidnightZapProvider({
  backend,
  contracts,
  network,
  zkAssetsBaseUrl,
  subjectId,
  children,
}: MidnightZapProviderProps) {
  const value = useMemo<MidnightZapContextValue>(() => {
    const resolvedBackend =
      backend ?? new LiveMidnightBackend({ bindings: contracts, network, zkAssetsBaseUrl });
    return {
      client: new MidnightZapClient({ backend: resolvedBackend }),
      subjectId: subjectId ?? autoSubjectId(),
    };
  }, [backend, contracts, network, zkAssetsBaseUrl, subjectId]);

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
