import React, { useCallback } from "react";
import { useProof } from "./useProof.js";
import { useResolvedSubjectId } from "./context.js";
import { GateShell, type GatePresentationProps } from "./GateShell.js";

export interface ProveCredentialValidProps extends GatePresentationProps {
  /** Which trusted-issuer registry to check against, e.g. "pharmacy-board". */
  issuer: string;
  /**
   * A stable, non-identifying id for this user/session. Optional — falls
   * back to the id from <MidnightZapProvider> (auto-generated if unset).
   */
  subjectId?: string;
  /**
   * Returns the credential's expiry as a Unix timestamp (seconds). Runs
   * on the client — the timestamp is never transmitted, only the proof
   * that it lies in the future. May be async.
   */
  getExpiresAtUnix: () => number | Promise<number>;
  onVerified?: (receipt: string) => void;
  /** Called when the credential is expired or not from a trusted issuer. */
  onRejected?: (reason: string) => void;
  onError?: (message: string) => void;
}

/**
 * Freshness / expiry gate: proves a credential (a licence, a
 * prescription, a KYC check) was issued by a trusted issuer and hasn't
 * expired — without revealing its issue date, expiry date, or contents.
 *
 *   <ProveCredentialValid
 *     issuer="pharmacy-board"
 *     getExpiresAtUnix={() => localCredentialStore.get("rx").expiresAt}
 *   >
 *     <RefillButton />
 *   </ProveCredentialValid>
 */
export function ProveCredentialValid({
  issuer,
  subjectId,
  getExpiresAtUnix,
  onVerified,
  onRejected,
  onError,
  ...presentation
}: ProveCredentialValidProps) {
  const resolvedSubjectId = useResolvedSubjectId(subjectId);
  const proof = useProof({ kind: "credential-valid", issuer });

  const trigger = useCallback(async () => {
    let expiresAtUnix: number;
    try {
      expiresAtUnix = await getExpiresAtUnix();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onError?.(message);
      return;
    }
    const result = await proof.run(resolvedSubjectId, { expiresAtUnix });
    if (result.verified && result.receipt) onVerified?.(result.receipt);
    else if (result.status === "error" && result.error) onError?.(result.error);
    else if (result.error) onRejected?.(result.error);
  }, [getExpiresAtUnix, proof, resolvedSubjectId, onVerified, onRejected, onError]);

  return (
    <GateShell
      proof={proof}
      trigger={trigger}
      wrapperClass="midnightzap-prove-credential-valid"
      idleLabel={`Prove ${issuer} credential is valid privately`}
      verifiedLabel="Valid credential (contents hidden)"
      {...presentation}
    />
  );
}
