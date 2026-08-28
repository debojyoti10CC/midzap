import type {
  ProofBackend,
  ProofRequest,
  ProofResult,
  ProofStatus,
} from "./types.js";

/**
 * LiveMidnightBackend
 * ---------------------
 * The real adapter: discovers a Midnight-compatible wallet (Lace and
 * others expose an injected connector), connects to it, and submits proof
 * requests to the deployed MidnightZap predicate contracts compiled from
 * /compact/*.compact.
 *
 * What is real here: wallet discovery + connection against the injected
 * `window.midnight` connector API, the status lifecycle, and the shape of
 * the witness / circuit call. What is NOT wired: the deployed contract
 * addresses — `compact compile && deploy` each template first and pass the
 * results to `contracts` (or set them in `CONTRACT_ADDRESSES`). Until then
 * `requestProof` throws a precise error at exactly that step rather than
 * pretending to submit.
 *
 * Package call shapes for `@midnight-ntwrk/dapp-connector-api` /
 * `@midnight-ntwrk/midnight-js-contracts` move quickly post-mainnet;
 * confirm against your installed versions. The two `// CONFIRM:` markers
 * below are the only places that touch those APIs.
 */

export interface DeployedContract {
  /** On-chain address of the deployed predicate contract. */
  address: string;
  /** Circuit entrypoint name inside that contract. */
  circuit: string;
}

/** Fill these in once you've deployed the templates (or pass `contracts`). */
const CONTRACT_ADDRESSES: Partial<Record<ProofRequest["predicate"]["kind"], DeployedContract>> = {
  // threshold: { address: "0x...", circuit: "proveThreshold" },
  // membership: { address: "0x...", circuit: "proveMembership" },
  // "credential-valid": { address: "0x...", circuit: "proveCredentialValid" },
};

export interface LiveMidnightBackendOptions {
  /** e.g. "testnet" | "mainnet" — passed through to the wallet connector. */
  network?: string;
  /** Which injected connector to use, e.g. "mnLace". Auto-detected if unset. */
  walletName?: string;
  /** Deployed predicate contracts, keyed by predicate kind. Overrides CONTRACT_ADDRESSES. */
  contracts?: Partial<Record<ProofRequest["predicate"]["kind"], DeployedContract>>;
}

interface InjectedConnector {
  enable(): Promise<WalletApi>;
  isEnabled(): Promise<boolean>;
  apiVersion?: string;
}
interface WalletApi {
  state(): Promise<unknown>;
  // CONFIRM: proof + submit surface of your installed dapp-connector version.
  [key: string]: unknown;
}

export class LiveMidnightBackend implements ProofBackend {
  private walletApi: WalletApi | null = null;

  constructor(private opts: LiveMidnightBackendOptions = {}) {}

  private get contracts() {
    return { ...CONTRACT_ADDRESSES, ...this.opts.contracts };
  }

  async connect(): Promise<void> {
    if (this.walletApi) return;

    const injected = discoverConnector(this.opts.walletName);
    if (!injected) {
      throw new Error(
        "No Midnight wallet found. Install a Midnight-compatible wallet " +
          "extension (e.g. Lace) and reload, or use MockProofBackend for " +
          "local development."
      );
    }

    // CONFIRM: `.enable()` is the standard injected-connector handshake;
    // some versions take a { network } argument.
    this.walletApi = await injected.enable();
  }

  async requestProof(
    req: ProofRequest,
    privateInput: Record<string, unknown>,
    onStatus?: (status: ProofStatus) => void
  ): Promise<ProofResult> {
    const emit = (s: ProofStatus) => onStatus?.(s);

    emit("connecting-wallet");
    await this.connect();

    const contract = this.contracts[req.predicate.kind];
    if (!contract) {
      return {
        status: "error",
        verified: false,
        error:
          `No deployed contract configured for the "${req.predicate.kind}" predicate. ` +
          `Compile compact/${templateFile(req.predicate.kind)} with the \`compact\` ` +
          `toolchain, deploy it, and pass its address via ` +
          `new LiveMidnightBackend({ contracts: { "${req.predicate.kind}": { address, circuit } } }).`,
      };
    }

    emit("generating-proof");
    const witness = buildWitness(req, privateInput);

    // CONFIRM: contract-call + local proof generation entrypoint of
    // @midnight-ntwrk/midnight-js-contracts for your installed version.
    // The private `witness` is consumed inside the wallet; only the proof
    // and public inputs leave the device.
    //
    //   const { txHash } = await callContract({
    //     wallet: this.walletApi,
    //     address: contract.address,
    //     circuit: contract.circuit,
    //     publicInputs: publicInputsFor(req),
    //     witness,
    //     network: this.opts.network ?? "testnet",
    //   });
    void witness;

    emit("submitting");
    // const receipt = await awaitFinality(txHash);
    // emit("verified");
    // return { status: "verified", verified: true, receipt: txHash };

    return {
      status: "error",
      verified: false,
      error:
        "LiveMidnightBackend: contract address is set but the submit call is " +
        "commented out — un-comment the @midnight-ntwrk/midnight-js-contracts " +
        "block once confirmed against your installed SDK version.",
    };
  }
}

function discoverConnector(preferred?: string): InjectedConnector | null {
  if (typeof window === "undefined") return null;
  const mn = (window as unknown as { midnight?: Record<string, InjectedConnector> }).midnight;
  if (!mn) return null;
  if (preferred && mn[preferred]) return mn[preferred];
  const first = Object.values(mn)[0];
  return first ?? null;
}

function templateFile(kind: ProofRequest["predicate"]["kind"]): string {
  return kind === "threshold"
    ? "threshold_proof.compact"
    : kind === "membership"
    ? "membership_proof.compact"
    : "expiry_proof.compact";
}

/** Assemble the private witness object the circuit expects, per predicate. */
function buildWitness(
  req: ProofRequest,
  privateInput: Record<string, unknown>
): Record<string, unknown> {
  switch (req.predicate.kind) {
    case "threshold":
      return { privateValue: BigInt(Number(privateInput.value)) };
    case "membership":
      return {
        memberSecret: String(privateInput.memberSecret ?? ""),
        // merkleProof is fetched from the set operator's tree service in a
        // real deployment; wire that here.
      };
    case "credential-valid":
      return {
        expiresAtUnix: BigInt(Number(privateInput.expiresAtUnix)),
        // issuerPublicKey / issuerSignature / credentialHash come from the
        // locally-held signed credential in a real deployment.
      };
  }
}
