import type {
  ProofBackend,
  ProofRequest,
  ProofResult,
  ProofStatus,
} from "./types.js";

/**
 * LiveMidnightBackend
 * ---------------------
 * The real adapter: connects to a Midnight-compatible wallet (e.g. Lace)
 * via the dApp connector, and submits proof requests to the deployed
 * MidnightZap predicate contracts compiled from /compact/*.compact.
 *
 * STATUS: scaffolded, not wired to a live testnet deployment. The exact
 * call shapes for @midnight-ntwrk/dapp-connector-api and
 * @midnight-ntwrk/midnight-js-contracts should be confirmed against the
 * current API reference (docs.midnight.network/api-reference) and your
 * installed SDK version before this goes live — those packages are
 * evolving quickly post-mainnet-launch. Everywhere that matters is marked
 * TODO below. Treat this file as the integration checklist, not a
 * finished driver.
 *
 * To go live:
 *   1. `compact compile` each .compact template to get its verifier key +
 *      contract address once deployed.
 *   2. Fill in CONTRACT_ADDRESSES below.
 *   3. Replace the TODOs with real calls against your installed SDK
 *      version's actual exports.
 *   4. Swap MockProofBackend for LiveMidnightBackend in
 *      <MidnightZapProvider backend={...} /> — nothing else in the host
 *      app changes.
 */

const CONTRACT_ADDRESSES: Record<string, string> = {
  threshold: "0x_TODO_DEPLOY_threshold_proof_compact",
  membership: "0x_TODO_DEPLOY_membership_proof_compact",
  "credential-valid": "0x_TODO_DEPLOY_expiry_proof_compact",
};

export interface LiveMidnightBackendOptions {
  /** e.g. "testnet" | "mainnet" — passed through to the dApp connector. */
  network?: string;
}

export class LiveMidnightBackend implements ProofBackend {
  private connected = false;

  constructor(private opts: LiveMidnightBackendOptions = {}) {}

  async connect(): Promise<void> {
    // TODO: real wallet connection via @midnight-ntwrk/dapp-connector-api,
    // e.g. requesting the injected `midnight` provider the way Lace
    // exposes it, then calling its `.enable()`/connect flow. See:
    // docs.midnight.network/sdks/community/build-using-meshsdk/lace-wallet
    //
    //   const connector = await window.midnight?.[walletName]?.enable();
    //   this.walletApi = connector;
    //
    // Left unimplemented here deliberately — filling this in requires a
    // browser context with an installed wallet extension, which a
    // sandboxed build environment doesn't have.
    throw new Error(
      "LiveMidnightBackend.connect() is a scaffold — wire it to " +
        "@midnight-ntwrk/dapp-connector-api before using it outside dev mode. " +
        "Use MockProofBackend for local development and demos."
    );
  }

  async requestProof(
    _req: ProofRequest,
    _privateInput: Record<string, unknown>,
    _onStatus?: (status: ProofStatus) => void
  ): Promise<ProofResult> {
    // TODO: build the witness object from `_privateInput`, call the
    // corresponding circuit on CONTRACT_ADDRESSES[_req.predicate.kind] via
    // @midnight-ntwrk/midnight-js-contracts' contract-call helpers, await
    // proof generation (this runs client-side, inside the wallet, so the
    // private input never leaves the device), then submit the resulting
    // transaction and await finality.
    throw new Error("LiveMidnightBackend.requestProof() is a scaffold — see TODOs in this file.");
  }
}
