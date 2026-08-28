import React from "react";
import { useProof } from "./useProof.js";
import type { ProofStatus } from "../core/types.js";

export interface ProveCredentialValidProps {
  /** Which trusted-issuer registry to check against, e.g. "pharmacy-board". */
  issuer: string;
  /** Opaque per-user/session id your app already has (never a real identity). */
  subjectId: string;
  /**
   * Returns the credential's expiry as a Unix timestamp (seconds). Runs
   * entirely on the client — the timestamp is never transmitted, only the
   * resulting proof that it lies in the future.
   */
  getExpiresAtUnix: () => number | Promise<number>;
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
 * Freshness / expiry gate: proves a credential (a licence, a prescription,
 * a KYC check, an insurance policy) was issued by a trusted issuer and has
 * not yet expired — without revealing its issue date, expiry date, or
 * contents.
 *
 *   <ProveCredentialValid
 *     issuer="pharmacy-board"
 *     subjectId={session.id}
 *     getExpiresAtUnix={() => localCredentialStore.get("rx").expiresAt}
 *     onVerified={() => unlockRefill()}
 *   />
 *
 * Backed by compact/expiry_proof.compact. As with the other predicates,
 * the host app writes no Compact and no ZK math.
 */
export function ProveCredentialValid({
  issuer,
  subjectId,
  getExpiresAtUnix,
  onVerified,
  onRejected,
  children,
}: ProveCredentialValidProps) {
  const { status, verified, error, run } = useProof({ kind: "credential-valid", issuer });

  const trigger = async () => {
    const expiresAtUnix = await getExpiresAtUnix();
    const result = await run(subjectId, { expiresAtUnix });
    if (result.verified && result.receipt) onVerified?.(result.receipt);
    if (!result.verified && result.error) onRejected?.(result.error);
  };

  if (children) {
    return <>{children({ status, verified, error, run: trigger })}</>;
  }

  return (
    <div className="midnightzap-prove-credential-valid" data-status={status}>
      {!verified && (
        <button onClick={trigger} disabled={status === "generating-proof" || status === "submitting"}>
          {status === "idle" || status === "rejected" || status === "error"
            ? `Prove ${issuer} credential is valid privately`
            : status === "connecting-wallet"
            ? "Connecting wallet..."
            : status === "generating-proof"
            ? "Generating zero-knowledge proof..."
            : "Submitting..."}
        </button>
      )}
      {verified && (
        <span className="midnightzap-verified-badge">&#10003; Valid credential (contents hidden)</span>
      )}
      {error && <p className="midnightzap-error">{error}</p>}
    </div>
  );
}
