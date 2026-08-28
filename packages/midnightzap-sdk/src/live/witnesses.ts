/**
 * Witness maps for the three predicate circuits, matching the generated
 * `Witnesses<PS>` types in each `managed/<circuit>/contract/index.d.ts`.
 *
 * In Compact a `witness foo()` is read from the contract's private state at
 * proving time; each function returns `[nextPrivateState, value]`.
 * MidnightZap seeds that private state from the component's getter
 * immediately before the circuit call, on-device — the value is consumed
 * by the local prover and never transmitted.
 */

/** Local stand-in for `@midnight-ntwrk/compact-runtime`'s WitnessContext. */
export interface WitnessCtx<PS> {
  privateState: PS;
}

export interface ThresholdPrivateState {
  /** The private numeric value proven against the public threshold. */
  readonly value: bigint;
}

export const thresholdWitnesses = {
  privateValue: ({ privateState }: WitnessCtx<ThresholdPrivateState>): [ThresholdPrivateState, bigint] => [
    privateState,
    privateState.value,
  ],
};

export interface MembershipPrivateState {
  /** 32-byte member credential secret. Its commitment must be in `members`. */
  readonly memberSecret: Uint8Array;
}

export const membershipWitnesses = {
  memberSecret: ({ privateState }: WitnessCtx<MembershipPrivateState>): [MembershipPrivateState, Uint8Array] => [
    privateState,
    privateState.memberSecret,
  ],
};

export interface ExpiryPrivateState {
  /** 32-byte hash of the credential; must be registered in `issuedCredentials`. */
  readonly credentialHash: Uint8Array;
}

export const expiryWitnesses = {
  credentialHash: ({ privateState }: WitnessCtx<ExpiryPrivateState>): [ExpiryPrivateState, Uint8Array] => [
    privateState,
    privateState.credentialHash,
  ],
};
