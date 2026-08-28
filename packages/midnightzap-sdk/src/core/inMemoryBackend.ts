import type {
  ProofBackend,
  ProofRequest,
  ProofResult,
  ProofStatus,
} from "./types.js";

/**
 * InMemoryProofBackend
 * --------------------
 * Evaluates the SAME accept/reject logic the real Compact circuits enforce
 * (see /compact/*.compact), fully deterministically and with no network.
 *
 * This is a UNIT-TESTING utility, not a way to run the app. It does not
 * produce zero-knowledge proofs and never touches Midnight. Assert your
 * predicate wiring against it in tests; run the real app on
 * `LiveMidnightBackend`, which is the `<MidnightZapProvider>` default.
 */
export class InMemoryProofBackend implements ProofBackend {
  private nullifiers = new Set<string>();
  private artificialDelayMs: number;

  constructor(opts: { artificialDelayMs?: number } = {}) {
    this.artificialDelayMs = opts.artificialDelayMs ?? 650;
  }

  async connect(): Promise<void> {
    await this.delay();
  }

  async requestProof(
    req: ProofRequest,
    privateInput: Record<string, unknown>,
    onStatus?: (status: ProofStatus) => void
  ): Promise<ProofResult> {
    const emit = (s: ProofStatus) => onStatus?.(s);

    emit("connecting-wallet");
    await this.delay();

    emit("generating-proof");
    await this.delay();

    const evaluation = this.evaluate(req, privateInput);
    if (!evaluation.ok) {
      emit("rejected");
      return { status: "rejected", verified: false, error: evaluation.reason };
    }

    emit("submitting");
    await this.delay();

    emit("verified");
    return {
      status: "verified",
      verified: true,
      receipt: await this.fakeReceipt(req),
    };
  }

  private evaluate(
    req: ProofRequest,
    privateInput: Record<string, unknown>
  ): { ok: true } | { ok: false; reason: string } {
    const { predicate } = req;

    switch (predicate.kind) {
      case "threshold": {
        const value = Number(privateInput.value);
        if (Number.isNaN(value)) {
          return { ok: false, reason: `Missing private value for field "${predicate.field}"` };
        }
        return value >= predicate.threshold
          ? { ok: true }
          : {
              ok: false,
              reason: `${predicate.field} does not meet required threshold of ${predicate.threshold}`,
            };
      }
      case "membership": {
        const memberSecret = String(privateInput.memberSecret ?? "");
        if (!memberSecret) {
          return { ok: false, reason: `No membership credential supplied for set "${predicate.set}"` };
        }
        const nullifierKey = `${predicate.set}:${predicate.actionTag}:${memberSecret}`;
        if (this.nullifiers.has(nullifierKey)) {
          return { ok: false, reason: "Credential already used for this action" };
        }
        this.nullifiers.add(nullifierKey);
        return { ok: true };
      }
      case "credential-valid": {
        const expiresAt = Number(privateInput.expiresAtUnix);
        const now = Date.now() / 1000;
        if (Number.isNaN(expiresAt)) {
          return { ok: false, reason: `No credential supplied for issuer "${predicate.issuer}"` };
        }
        return expiresAt > now
          ? { ok: true }
          : { ok: false, reason: "Credential has expired" };
      }
    }
  }

  private async fakeReceipt(req: ProofRequest): Promise<string> {
    const raw = `${req.subjectId}:${req.predicate.kind}:${Date.now()}`;
    if (typeof crypto !== "undefined" && "subtle" in crypto) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 32);
    }
    // Non-crypto fallback (older test runners without WebCrypto).
    return raw.split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(16);
  }

  private delay() {
    return new Promise((r) => setTimeout(r, this.artificialDelayMs));
  }
}

/**
 * @deprecated Renamed to `InMemoryProofBackend` to make its role clear —
 * it is a test double, not a runnable backend. This alias will be removed.
 */
export const MockProofBackend = InMemoryProofBackend;
