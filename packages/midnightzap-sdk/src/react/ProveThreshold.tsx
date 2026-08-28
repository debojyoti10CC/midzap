import React, { useCallback } from "react";
import { useProof } from "./useProof.js";
import { useResolvedSubjectId } from "./context.js";
import { GateShell, type GatePresentationProps } from "./GateShell.js";

export interface ProveThresholdProps extends GatePresentationProps {
  /** UI label only, e.g. "age", "income". Not sent anywhere private. */
  field: string;
  /** Public threshold the private value must meet or exceed. */
  threshold: number;
  /**
   * A stable, non-identifying id for this user/session. Optional — falls
   * back to the id from <MidnightZapProvider> (auto-generated if unset).
   */
  subjectId?: string;
  /**
   * Returns the private value to prove against. Runs entirely on the
   * client — nothing it returns is transmitted, only the resulting
   * yes/no proof. May be async. Throwing here surfaces as an error and
   * fires `onError`.
   */
  getPrivateValue: () => number | Promise<number>;
  /** Called once the proof is accepted. Use it to unlock your gated UI. */
  onVerified?: (receipt: string) => void;
  /** Called when a valid proof could not be produced (threshold not met). */
  onRejected?: (reason: string) => void;
  /** Called when something errored (getter threw, backend/wallet failure). */
  onError?: (message: string) => void;
}

/**
 * The whole pitch of MidnightZap in one component. Drop it into any
 * existing checkout / signup / age-gate flow and put the gated content
 * inside it:
 *
 *   <ProveThreshold
 *     field="age"
 *     threshold={21}
 *     getPrivateValue={() => currentYear - user.birthYear}
 *   >
 *     <CompletePurchaseButton />
 *   </ProveThreshold>
 *
 * No Compact, no ZK math, no wallet plumbing in the host app.
 */
export function ProveThreshold({
  field,
  threshold,
  subjectId,
  getPrivateValue,
  onVerified,
  onRejected,
  onError,
  ...presentation
}: ProveThresholdProps) {
  const resolvedSubjectId = useResolvedSubjectId(subjectId);
  const proof = useProof({ kind: "threshold", field, threshold });

  const trigger = useCallback(async () => {
    let value: number;
    try {
      value = await getPrivateValue();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onError?.(message);
      return;
    }
    const result = await proof.run(resolvedSubjectId, { value });
    if (result.verified && result.receipt) onVerified?.(result.receipt);
    else if (result.status === "error" && result.error) onError?.(result.error);
    else if (result.error) onRejected?.(result.error);
  }, [getPrivateValue, proof, resolvedSubjectId, onVerified, onRejected, onError]);

  return (
    <GateShell
      proof={proof}
      trigger={trigger}
      wrapperClass="midnightzap-prove-threshold"
      idleLabel={`Prove ${field} ≥ ${threshold} privately`}
      verifiedLabel="Verified privately"
      {...presentation}
    />
  );
}
