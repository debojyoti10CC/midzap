import React, { useCallback } from "react";
import { useProof } from "./useProof.js";
import { useResolvedSubjectId } from "./context.js";
import { GateShell, type GatePresentationProps } from "./GateShell.js";

export interface ProveMembershipProps extends GatePresentationProps {
  /** Which private member set to check against, e.g. "verified-employees". */
  set: string;
  /** Scopes the anti-replay nullifier to one action, e.g. "login", "vote:proposal-12". */
  actionTag: string;
  /**
   * A stable, non-identifying id for this user/session. Optional — falls
   * back to the id from <MidnightZapProvider> (auto-generated if unset).
   */
  subjectId?: string;
  /** Returns the caller's membership credential secret (never transmitted raw). May be async. */
  getMemberSecret: () => string | Promise<string>;
  /**
   * Live mode only: extra private witness material the circuit needs but
   * the component doesn't model — e.g. `{ merklePath }` from your set
   * operator's tree service. Merged into the private input, on-device.
   */
  getExtraWitness?: () => Record<string, unknown> | Promise<Record<string, unknown>>;
  onVerified?: (receipt: string) => void;
  /** Called when membership couldn't be proven, or the credential was already used for this action. */
  onRejected?: (reason: string) => void;
  onError?: (message: string) => void;
}

/**
 * Anonymous-but-verified access: proves "I hold a credential in this set"
 * without revealing which member you are, and a per-action nullifier
 * stops the same credential being replayed (voting twice, "anonymously"
 * posting as two people). Put the gated UI inside it:
 *
 *   <ProveMembership
 *     set="verified-employees"
 *     actionTag="login"
 *     getMemberSecret={() => localCredentialStore.get("employeeCred")}
 *   >
 *     <ForumComposer />
 *   </ProveMembership>
 */
export function ProveMembership({
  set,
  actionTag,
  subjectId,
  getMemberSecret,
  getExtraWitness,
  onVerified,
  onRejected,
  onError,
  ...presentation
}: ProveMembershipProps) {
  const resolvedSubjectId = useResolvedSubjectId(subjectId);
  const proof = useProof({ kind: "membership", set, actionTag });

  const trigger = useCallback(async () => {
    let privateInput: Record<string, unknown>;
    try {
      privateInput = { memberSecret: await getMemberSecret(), ...(await getExtraWitness?.()) };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onError?.(message);
      return;
    }
    const result = await proof.run(resolvedSubjectId, privateInput);
    if (result.verified && result.receipt) onVerified?.(result.receipt);
    else if (result.status === "error" && result.error) onError?.(result.error);
    else if (result.error) onRejected?.(result.error);
  }, [getMemberSecret, getExtraWitness, proof, resolvedSubjectId, onVerified, onRejected, onError]);

  return (
    <GateShell
      proof={proof}
      trigger={trigger}
      wrapperClass="midnightzap-prove-membership"
      idleLabel={`Verify membership in "${set}" anonymously`}
      verifiedLabel="Verified member (identity hidden)"
      {...presentation}
    />
  );
}
