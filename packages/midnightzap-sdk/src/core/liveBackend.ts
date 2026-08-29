import type {
  ContractBinding,
  ContractBindings,
  ProofBackend,
  ProofRequest,
  ProofResult,
  ProofStatus,
  PredicateKind,
} from "./types.js";
import {
  configureProviders,
  contractHelpers,
  type MidnightProviders,
} from "../live/providers.js";
import {
  thresholdWitnesses,
  membershipWitnesses,
  expiryWitnesses,
} from "../live/witnesses.js";

/**
 * LiveMidnightBackend
 * ---------------------
 * Real proofs against a real Midnight network. Flow per request:
 *
 *   1. discover + connect the injected wallet, build the midnight-js
 *      providers (once, cached).
 *   2. load the `compactc` output for the predicate's circuit (the app
 *      supplies the import via `bindings`).
 *   3. seed the circuit's private state from the component's getter,
 *      on-device.
 *   4. `findDeployedContract(...)` at the deployed address, then call the
 *      circuit — proof generation runs client-side in the wallet/prover;
 *      the private input never leaves the device.
 *   5. submit, await finality, return the tx id as the receipt.
 *
 * Prerequisites (one-time — see compact/README.md and the @midzap/sdk README):
 *   - `compactc compile` each template, copy `managed/<circuit>/` into your
 *     app's `public/`.
 *   - deploy each contract once; put the addresses in `bindings`.
 *   - install the `@midnight-ntwrk/*` peer deps.
 */

interface CircuitSpec {
  circuit: string;
  privateStateId: string;
  witnesses: unknown;
  toPrivateState: (input: Record<string, unknown>) => unknown;
  publicArgs: (req: ProofRequest, input: Record<string, unknown>) => Promise<unknown[]>;
}

const SPECS: Record<PredicateKind, CircuitSpec> = {
  threshold: {
    circuit: "proveThreshold",
    privateStateId: "mz-threshold",
    witnesses: thresholdWitnesses,
    toPrivateState: (i) => ({ value: BigInt(Number(i.value)) }),
    publicArgs: async (req) => {
      if (req.predicate.kind !== "threshold") return [];
      return [await sha256Bytes(req.subjectId), BigInt(req.predicate.threshold)];
    },
  },
  membership: {
    circuit: "proveMembership",
    privateStateId: "mz-membership",
    witnesses: membershipWitnesses,
    toPrivateState: (i) => ({ memberSecret: toBytes32(i.memberSecret) }),
    publicArgs: async (req) => {
      if (req.predicate.kind !== "membership") return [];
      return [await sha256Bytes(`${req.predicate.set}:${req.predicate.actionTag}`)];
    },
  },
  "credential-valid": {
    circuit: "proveCredentialValid",
    privateStateId: "mz-expiry",
    witnesses: expiryWitnesses,
    toPrivateState: (i) => {
      // v1 circuit: the private witness is the credential hash; its expiry
      // is read from the on-chain registry. Pass the hash from
      // <ProveCredentialValid getExtraWitness={() => ({ credentialHash })} />.
      if (i.credentialHash == null) {
        throw new Error(
          "Live credential proofs need `credentialHash`. Pass it from " +
            "<ProveCredentialValid getExtraWitness={() => ({ credentialHash })} />."
        );
      }
      return { credentialHash: toBytes32(i.credentialHash) };
    },
    publicArgs: async () => [BigInt(Math.floor(Date.now() / 1000))],
  },
};

export interface LiveMidnightBackendOptions {
  /** e.g. "testnet" | "mainnet" — informational; the wallet decides the network. */
  network?: string;
  /** Injected connector key, e.g. "mnLace". Auto-detected if unset. */
  walletName?: string;
  /** Where the browser fetches compiled `managed/<circuit>/` zk-params. Defaults to page origin. */
  zkAssetsBaseUrl?: string;
  /** Deployed predicate contracts, keyed by predicate kind. */
  bindings?: ContractBindings;
}

export class LiveMidnightBackend implements ProofBackend {
  private providersP: Promise<{ providers: MidnightProviders }> | null = null;

  constructor(private opts: LiveMidnightBackendOptions = {}) {}

  async connect(): Promise<void> {
    if (!this.providersP) {
      this.providersP = configureProviders({
        walletName: this.opts.walletName,
        zkAssetsBaseUrl: this.opts.zkAssetsBaseUrl,
      });
    }
    await this.providersP;
  }

  async requestProof(
    req: ProofRequest,
    privateInput: Record<string, unknown>,
    onStatus?: (status: ProofStatus) => void
  ): Promise<ProofResult> {
    const emit = (s: ProofStatus) => onStatus?.(s);
    const kind = req.predicate.kind;
    const binding = this.opts.bindings?.[kind];

    if (!binding) {
      return err(
        `No deployed contract configured for the "${kind}" predicate. Compile ` +
          `compact/${templateFile(kind)} with \`compactc\`, deploy it once, and pass ` +
          `<MidnightZapProvider contracts={{ "${kind}": { address, load } }}>. ` +
          `See the @midzap/sdk README.`
      );
    }

    try {
      emit("connecting-wallet");
      await this.connect();
      const { providers } = await this.providersP!;
      const findDeployed = contractHelpers.findDeployedContract;
      if (!findDeployed) return err("midnight-js contract helpers unavailable — check the @midnight-ntwrk peer deps.");

      const spec = SPECS[kind];
      const mod = await binding.load();
      const Contract = mod.Contract;

      await providers.privateStateProvider.set(spec.privateStateId, spec.toPrivateState(privateInput));

      const deployed = (await findDeployed(providers, {
        contractAddress: binding.address,
        contract: new Contract(spec.witnesses),
        privateStateId: spec.privateStateId,
      })) as { callTx: Record<string, (...a: unknown[]) => Promise<{ public: { txId: string } }>> };

      emit("generating-proof");
      const args = await spec.publicArgs(req, privateInput);

      emit("submitting");
      const finalized = await deployed.callTx[spec.circuit](...args);

      emit("verified");
      return { status: "verified", verified: true, receipt: finalized.public.txId };
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e));
    }
  }
}

function err(error: string): ProofResult {
  return { status: "error", verified: false, error };
}

function templateFile(kind: PredicateKind): string {
  return kind === "threshold"
    ? "threshold_proof.compact"
    : kind === "membership"
    ? "membership_proof.compact"
    : "expiry_proof.compact";
}

async function sha256Bytes(input: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(input);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  }
  throw new Error("WebCrypto SHA-256 unavailable in this environment.");
}

function toBytes(v: unknown): Uint8Array {
  if (v instanceof Uint8Array) return v;
  const s = String(v);
  if (/^(0x)?[0-9a-fA-F]+$/.test(s)) {
    const hex = s.replace(/^0x/, "");
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return out;
  }
  return new TextEncoder().encode(s);
}

function toBytes32(v: unknown): Uint8Array {
  const b = toBytes(v);
  if (b.length === 32) return b;
  const out = new Uint8Array(32);
  out.set(b.subarray(0, 32));
  return out;
}

export type { ContractBinding };
