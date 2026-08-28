import React from "react";
import { useProof } from "./useProof.js";
import type { ProofStatus } from "../core/types.js";

export interface ProveMembershipProps {
  /** Which private member set to check against, e.g. "verified-employees". */
  set: string;
  /** Scopes the anti-replay nullifier to one action, e.g. "login", "vote:proposal-12". */
  actionTag: string;
  subjectId: string;
  /** Returns the caller's membership credential secret (never transmitted raw). */
  getMemberSecret: () => string | Promise<string>;
  onVerified?: (receipt: string) => void;
  onRejected?: (reason: string) => void;
  children?: (state: {
    status: ProofStatus;
    verified: boolean;
    error?: string;
    run: () => void;
  }) => React.ReactNode;
}

/**
 * Anonymous-but-verified access: proves "I hold a credential in this set"
 * without revealing which member you are, and prevents the same
 * credential from being replayed for the same action (e.g. voting twice,
 * or "anonymously" posting as two different people).
 *
 *   <ProveMembership
 *     set="verified-employees"
 *     actionTag="login"
 *     subjectId={session.id}
 *     getMemberSecret={() => localCredentialStore.get("employeeCred")}
 *     onVerified={() => grantAnonymousSession()}
 *   />
 */
export function ProveMembership({
  set,
  actionTag,
  subjectId,
  getMemberSecret,
  onVerified,
  onRejected,
  children,
}: ProveMembershipProps) {
  const { status, verified, error, run } = useProof({ kind: "membership", set, actionTag });

  const trigger = async () => {
    const memberSecret = await getMemberSecret();
    const result = await run(subjectId, { memberSecret });
    if (result.verified && result.receipt) onVerified?.(result.receipt);
    if (!result.verified && result.error) onRejected?.(result.error);
  };

  if (children) {
    return <>{children({ status, verified, error, run: trigger })}</>;
  }

  return (
    <div className="midnightzap-prove-membership" data-status={status}>
      {!verified && (
        <button onClick={trigger} disabled={status === "generating-proof" || status === "submitting"}>
          {status === "idle" || status === "rejected" || status === "error"
            ? `Verify membership in "${set}" anonymously`
            : status === "connecting-wallet"
            ? "Connecting wallet..."
            : status === "generating-proof"
            ? "Generating zero-knowledge proof..."
            : "Submitting..."}
        </button>
      )}
      {verified && <span className="midnightzap-verified-badge">&#10003; Verified member (identity hidden)</span>}
      {error && <p className="midnightzap-error">{error}</p>}
    </div>
  );
}
