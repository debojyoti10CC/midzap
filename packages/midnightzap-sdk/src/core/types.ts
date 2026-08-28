/**
 * Core types shared across every MidnightZap predicate template.
 *
 * The whole SDK is built around one idea: a "predicate" is a small,
 * pre-written, pre-audited Compact circuit (see /compact/*.compact in the
 * repo root) that answers a yes/no question about private data. MidnightZap
 * never asks the host app to write ZK circuits — it asks it to pick a
 * predicate and supply parameters.
 */

/** The predicate templates MidnightZap ships out of the box. */
export type PredicateKind = "threshold" | "membership" | "credential-valid";

export interface ThresholdPredicate {
  kind: "threshold";
  /** e.g. "age", "income", "creditScore" — a label for UI/logging only. */
  field: string;
  /** The public threshold the private value must meet or exceed. */
  threshold: number;
}

export interface MembershipPredicate {
  kind: "membership";
  /** Which private member set to check against, e.g. "verified-employees". */
  set: string;
  /** Scopes the anti-replay nullifier to one action, e.g. "vote:proposal-12". */
  actionTag: string;
}

export interface CredentialValidPredicate {
  kind: "credential-valid";
  /** Which trusted-issuer registry to check against, e.g. "pharmacy-board". */
  issuer: string;
}

export type Predicate =
  | ThresholdPredicate
  | MembershipPredicate
  | CredentialValidPredicate;

export interface ProofRequest {
  predicate: Predicate;
  /** Opaque id the host app uses for this user/session (never a real identity). */
  subjectId: string;
}

export type ProofStatus =
  | "idle"
  | "connecting-wallet"
  | "generating-proof"
  | "submitting"
  | "verified"
  | "rejected"
  | "error";

export interface ProofResult {
  status: ProofStatus;
  /** True only once a proof has been generated AND accepted by the contract. */
  verified: boolean;
  /** Opaque, non-reversible receipt — safe to log, never contains the private value. */
  receipt?: string;
  error?: string;
}

/**
 * Points the live backend at one deployed predicate contract. The app owns
 * this because only the app knows where its `compactc` output lives.
 *
 *   {
 *     address: "0x…",                                     // from your one-time deploy
 *     load: () => import("./managed/threshold/contract/index.cjs"),
 *   }
 */
export interface ContractBinding {
  address: string;
  load: () => Promise<{ Contract: new (witnesses: unknown) => unknown } & Record<string, unknown>>;
}

export type ContractBindings = Partial<Record<PredicateKind, ContractBinding>>;

/**
 * A ProofBackend is anything that can turn a ProofRequest + locally-held
 * private data into a ProofResult. This indirection is what lets the same
 * <ProveThreshold /> component run against:
 *   - LiveMidnightBackend  → real wallet connection, real Compact contract
 *                           calls, real Midnight testnet/mainnet proofs.
 *                           This is the default.
 *   - InMemoryProofBackend → evaluates the same accept/reject logic the
 *                           circuits enforce, with no network. For unit
 *                           tests only — not a way to run the app.
 */
export interface ProofBackend {
  connect(): Promise<void>;
  requestProof(
    req: ProofRequest,
    privateInput: Record<string, unknown>,
    onStatus?: (status: ProofStatus) => void
  ): Promise<ProofResult>;
}
