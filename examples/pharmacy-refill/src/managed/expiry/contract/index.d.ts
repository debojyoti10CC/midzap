import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  credentialHash(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  registerCredential(context: __compactRuntime.CircuitContext<PS>,
                     hash_0: Uint8Array,
                     expiresAtUnix_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  proveCredentialValid(context: __compactRuntime.CircuitContext<PS>,
                       nowUnix_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type ProvableCircuits<PS> = {
  registerCredential(context: __compactRuntime.CircuitContext<PS>,
                     hash_0: Uint8Array,
                     expiresAtUnix_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  proveCredentialValid(context: __compactRuntime.CircuitContext<PS>,
                       nowUnix_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  registerCredential(context: __compactRuntime.CircuitContext<PS>,
                     hash_0: Uint8Array,
                     expiresAtUnix_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  proveCredentialValid(context: __compactRuntime.CircuitContext<PS>,
                       nowUnix_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type Ledger = {
  issuedCredentials: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): Promise<__compactRuntime.ConstructorResult<PS>>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
export declare const expectedVk: Record<string, string>;
