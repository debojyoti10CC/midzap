import type {
  ProofBackend,
  ProofRequest,
  ProofResult,
  ProofStatus,
  Predicate,
} from "./types.js";

export interface MidnightZapClientOptions {
  backend: ProofBackend;
}

/**
 * MidnightZapClient — the framework-agnostic core. The React layer
 * (src/react) is a thin wrapper around this; if you're building with
 * Vue/Svelte/vanilla JS, use this class directly.
 */
export class MidnightZapClient {
  private backend: ProofBackend;
  private connected = false;

  constructor(opts: MidnightZapClientOptions) {
    this.backend = opts.backend;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    await this.backend.connect();
    this.connected = true;
  }

  /**
   * Runs a predicate proof for `subjectId` against `privateInput`.
   * `privateInput` never leaves the caller's process/device as raw
   * data — the backend consumes it locally to produce a proof.
   */
  async prove(
    predicate: Predicate,
    subjectId: string,
    privateInput: Record<string, unknown>,
    onStatus?: (status: ProofStatus) => void
  ): Promise<ProofResult> {
    await this.connect();
    const req: ProofRequest = { predicate, subjectId };
    return this.backend.requestProof(req, privateInput, onStatus);
  }
}
