import React from "react";
import { useProof } from "./useProof.js";
import type { ProofStatus } from "../core/types.js";

export interface ProveThresholdProps {
  /** UI label only, e.g. "age", "income". Not sent anywhere private. */
  field: string;
  /** Public threshold the private value must meet or exceed. */
  threshold: number;
  /** Opaque per-user/session id your app already has (never a real identity). */
  subjectId: string;
  /**
   * Returns the private value to prove against. This runs entirely on the
   * client — nothing it returns is transmitted; only the resulting proof
   * (a yes/no) is.
   */
  getPrivateValue: () => number | Promise<number>;
  /** Called once the proof is accepted. Use this to unlock your gated UI. */
  onVerified?: (receipt: string) => void;
  onRejected?: (reason: string) => void;
  /** Custom render — omit for the default drop-in button. */
  children?: (state: {
    status: ProofStatus;
    verified: boolean;
    error?: string;
    run: () => void;
  }) => React.ReactNode;
}

/**
 * The whole pitch of MidnightZap in one component. Drop this into any
 * existing checkout/signup/age-gate flow:
 *
 *   <ProveThreshold
 *     field="age"
 *     threshold={21}
 *     subjectId={session.id}
 *     getPrivateValue={() => user.birthYear ? currentYear - user.birthYear : NaN}
 *     onVerified={() => setCheckoutUnlocked(true)}
 *   />
 *
 * No Compact, no ZK math, no wallet plumbing in the host app — that's all
 * behind the predicate template + the backend passed to
 * <MidnightZapProvider>.
 */
export function ProveThreshold({
  field,
  threshold,
  subjectId,
  getPrivateValue,
  onVerified,
  onRejected,
  children,
}: ProveThresholdProps) {
  const { status, verified, error, run } = useProof({ kind: "threshold", field, threshold });

  const trigger = async () => {
    const value = await getPrivateValue();
    const result = await run(subjectId, { value });
    if (result.verified && result.receipt) onVerified?.(result.receipt);
    if (!result.verified && result.error) onRejected?.(result.error);
  };

  if (children) {
    return <>{children({ status, verified, error, run: trigger })}</>;
  }

  return (
    <div className="midnightzap-prove-threshold" data-status={status}>
      {!verified && (
        <button onClick={trigger} disabled={status === "generating-proof" || status === "submitting"}>
          {status === "idle" || status === "rejected" || status === "error"
            ? `Prove ${field} ≥ ${threshold} privately`
            : status === "connecting-wallet"
            ? "Connecting wallet..."
            : status === "generating-proof"
            ? "Generating zero-knowledge proof..."
            : "Submitting..."}
        </button>
      )}
      {verified && <span className="midnightzap-verified-badge">&#10003; Verified privately</span>}
      {error && <p className="midnightzap-error">{error}</p>}
    </div>
  );
}
