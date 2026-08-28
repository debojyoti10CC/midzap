import { useCallback, useState } from "react";
import { useMidnightZapClient } from "./context.js";
import type { Predicate, ProofResult, ProofStatus } from "../core/types.js";

export interface UseProofState {
  status: ProofStatus;
  verified: boolean;
  error?: string;
  receipt?: string;
  /** Kick off proof generation. Resolves once verified/rejected/errored. */
  run: (subjectId: string, privateInput: Record<string, unknown>) => Promise<ProofResult>;
  reset: () => void;
}

/**
 * The one hook underneath every MidnightZap component. Most apps will
 * reach for <ProveThreshold>/<ProveMembership> instead, but useProof()
 * is there for fully custom UI.
 */
export function useProof(predicate: Predicate): UseProofState {
  const client = useMidnightZapClient();
  const [status, setStatus] = useState<ProofStatus>("idle");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [receipt, setReceipt] = useState<string | undefined>();

  const run = useCallback(
    async (subjectId: string, privateInput: Record<string, unknown>) => {
      setError(undefined);
      const result = await client.prove(predicate, subjectId, privateInput, setStatus);
      setVerified(result.verified);
      setError(result.error);
      setReceipt(result.receipt);
      return result;
    },
    [client, predicate]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setVerified(false);
    setError(undefined);
    setReceipt(undefined);
  }, []);

  return { status, verified, error, receipt, run, reset };
}
