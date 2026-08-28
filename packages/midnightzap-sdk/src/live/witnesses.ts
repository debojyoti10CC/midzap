/**
 * Witness maps for the three predicate circuits.
 *
 * In Compact a `witness foo(): T` is not a circuit argument — it is read
 * from the contract's private state at proving time. Each function here
 * returns `[nextPrivateState, value]`. MidnightZap seeds that private state
 * from the component's getter (`getPrivateValue` / `getMemberSecret` /
 * `getExpiresAtUnix`) immediately before the circuit call, on-device; the
 * value is consumed by the local prover and never transmitted.
 *
 * The shapes below must line up with the `witness` declarations in
 * `compact/*.compact`. If you change a template, change its map here.
 */

/** Minimal local stand-in for `@midnight-ntwrk/midnight-js-types`' WitnessContext. */
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
  /** 32-byte member credential secret. */
  readonly memberSecret: Uint8Array;
  /** Merkle path from `memberSecret`'s leaf to the set's published root. */
  readonly merklePath: unknown;
}

export const membershipWitnesses = {
  memberSecret: ({ privateState }: WitnessCtx<MembershipPrivateState>): [MembershipPrivateState, Uint8Array] => [
    privateState,
    privateState.memberSecret,
  ],
  merkleProof: ({ privateState }: WitnessCtx<MembershipPrivateState>): [MembershipPrivateState, unknown] => [
    privateState,
    privateState.merklePath,
  ],
};

export interface ExpiryPrivateState {
  readonly expiresAtUnix: bigint;
  readonly issuerPublicKey: Uint8Array;
  readonly issuerSignature: Uint8Array;
  readonly credentialHash: Uint8Array;
}

export const expiryWitnesses = {
  expiresAtUnix: ({ privateState }: WitnessCtx<ExpiryPrivateState>): [ExpiryPrivateState, bigint] => [
    privateState,
    privateState.expiresAtUnix,
  ],
  issuerPublicKey: ({ privateState }: WitnessCtx<ExpiryPrivateState>): [ExpiryPrivateState, Uint8Array] => [
    privateState,
    privateState.issuerPublicKey,
  ],
  issuerSignature: ({ privateState }: WitnessCtx<ExpiryPrivateState>): [ExpiryPrivateState, Uint8Array] => [
    privateState,
    privateState.issuerSignature,
  ],
  credentialHash: ({ privateState }: WitnessCtx<ExpiryPrivateState>): [ExpiryPrivateState, Uint8Array] => [
    privateState,
    privateState.credentialHash,
  ],
};
