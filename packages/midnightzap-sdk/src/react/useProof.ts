import { useCallback, useRef, useState } from "react";
import { useMidnightZapClient } from "./context.js";
import type { Predicate, ProofResult, ProofStatus } from "../core/types.js";

export interface UseProofState {
  status: ProofStatus;
  verified: boolean;
  error?: string;
  receipt?: string;
  /** True while a proof is in flight (connecting / generating / submitting). */
  busy: boolean;
  /** Kick off proof generation. Resolves once verified / rejected / errored. */
  run: (subjectId: string, privateInput: Record<string, unknown>) => Promise<ProofResult>;
  /** Re-run with the same arguments as the last `run()` call. */
  retry: () => Promise<ProofResult>;
  reset: () => void;
}

const BUSY: ProofStatus[] = ["connecting-wallet", "generating-proof", "submitting"];

/**
 * The one hook underneath every MidnightZap component. Most apps reach for
 * <ProveThreshold> / <ProveMembership> / <ProveCredentialValid>, but
 * useProof() is here for fully custom UI or non-standard flows.
 */
export function useProof(predicate: Predicate): UseProofState {
  const client = useMidnightZapClient();
  const [status, setStatus] = useState<ProofStatus>("idle");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [receipt, setReceipt] = useState<string | undefined>();
  const lastArgs = useRef<[string, Record<string, unknown>] | null>(null);

  const run = useCallback(
    async (subjectId: string, privateInput: Record<string, unknown>) => {
      lastArgs.current = [subjectId, privateInput];
      setError(undefined);
      try {
        const result = await client.prove(predicate, subjectId, privateInput, setStatus);
        setVerified(result.verified);
        setError(result.error);
        setReceipt(result.receipt);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setStatus("error");
        setVerified(false);
        setError(message);
        return { status: "error" as const, verified: false, error: message };
      }
    },
    [client, predicate]
  );

  const retry = useCallback(() => {
    if (!lastArgs.current) return Promise.resolve({ status: "idle" as const, verified: false });
    return run(lastArgs.current[0], lastArgs.current[1]);
  }, [run]);

  const reset = useCallback(() => {
    lastArgs.current = null;
    setStatus("idle");
    setVerified(false);
    setError(undefined);
    setReceipt(undefined);
  }, []);

  return { status, verified, error, receipt, busy: BUSY.includes(status), run, retry, reset };
}
