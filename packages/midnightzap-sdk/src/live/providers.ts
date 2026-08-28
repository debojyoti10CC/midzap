// @ts-nocheck — this is the one file bound to specific `@midnight-ntwrk/*`
// versions. Their provider constructors and helper signatures (e.g.
// `levelPrivateStateProvider` gaining an accountId + password provider,
// `httpClientProofProvider` arity) shift between releases, so it is not
// type-checked here; confirm the calls against your installed versions.
// The exported *types* (`MidnightProviders`, `configureProviders`) stay
// stable and are checked by every consumer of this module.

/**
 * Provider wiring for a real Midnight network connection.
 *
 * This is the one file that touches the `@midnight-ntwrk/*` stack directly.
 * The packages are optional peer dependencies — install them in the app
 * that uses `LiveMidnightBackend`:
 *
 *   npm i @midnight-ntwrk/midnight-js-contracts \
 *         @midnight-ntwrk/midnight-js-types \
 *         @midnight-ntwrk/midnight-js-level-private-state-provider \
 *         @midnight-ntwrk/midnight-js-indexer-public-data-provider \
 *         @midnight-ntwrk/midnight-js-http-client-proof-provider \
 *         @midnight-ntwrk/midnight-js-fetch-zk-config-provider \
 *         @midnight-ntwrk/dapp-connector-api
 *
 * Field names on `serviceUriConfig()` and `wallet.state()` have changed
 * across releases — pin your versions and confirm both objects in devtools
 * once. Everything else here is stable.
 */

/** The shape MidnightZap needs back — a subset of the midnight-js providers bag. */
export interface MidnightProviders {
  privateStateProvider: {
    set(id: string, state: unknown): Promise<void>;
  } & Record<string, unknown>;
  publicDataProvider: unknown;
  zkConfigProvider: unknown;
  proofProvider: unknown;
  walletProvider: Record<string, unknown>;
  midnightProvider: Record<string, unknown>;
}

export interface ConfigureProvidersOptions {
  /** Injected connector key, e.g. "mnLace". Auto-detected if unset. */
  walletName?: string;
  /**
   * Base URL the browser can fetch the compiled `managed/<circuit>/`
   * zk-params from. Defaults to the page origin (copy `managed/` into your
   * app's `public/`).
   */
  zkAssetsBaseUrl?: string;
  /** Namespaces the on-device private-state store. */
  privateStateStoreName?: string;
}

interface InjectedConnector {
  enable(): Promise<WalletApi>;
  isEnabled(): Promise<boolean>;
  serviceUriConfig(): Promise<Record<string, string>>;
  apiVersion?: string;
}
interface WalletApi {
  state(): Promise<Record<string, unknown>>;
  balanceAndProveTransaction(tx: unknown, newCoins: unknown): Promise<unknown>;
  submitTransaction(tx: unknown): Promise<string>;
}

export function discoverConnector(preferred?: string): InjectedConnector | null {
  if (typeof window === "undefined") return null;
  const mn = (window as unknown as { midnight?: Record<string, InjectedConnector> }).midnight;
  if (!mn) return null;
  if (preferred && mn[preferred]) return mn[preferred];
  return Object.values(mn)[0] ?? null;
}

export async function configureProviders(
  opts: ConfigureProvidersOptions = {}
): Promise<{ providers: MidnightProviders; wallet: WalletApi }> {
  const connector = discoverConnector(opts.walletName);
  if (!connector) {
    throw new Error(
      "No Midnight wallet detected. Install a Midnight-compatible wallet " +
        "(e.g. Lace, Midnight preview) and reload the page."
    );
  }

  const [
    { deployContract, findDeployedContract },
    { levelPrivateStateProvider },
    { indexerPublicDataProvider },
    { httpClientProofProvider },
    { FetchZkConfigProvider },
  ] = await Promise.all([
    import("@midnight-ntwrk/midnight-js-contracts"),
    import("@midnight-ntwrk/midnight-js-level-private-state-provider"),
    import("@midnight-ntwrk/midnight-js-indexer-public-data-provider"),
    import("@midnight-ntwrk/midnight-js-http-client-proof-provider"),
    import("@midnight-ntwrk/midnight-js-fetch-zk-config-provider"),
  ]);
  // Re-export the two contract helpers so liveBackend doesn't import twice.
  contractHelpers.deployContract = deployContract;
  contractHelpers.findDeployedContract = findDeployedContract;

  const wallet = await connector.enable();
  const uris = await connector.serviceUriConfig();
  const state = await wallet.state();

  const providers: MidnightProviders = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: opts.privateStateStoreName ?? "midnightzap",
    }),
    publicDataProvider: indexerPublicDataProvider(
      uris.indexerUri ?? uris.indexer,
      uris.indexerWsUri ?? uris.indexerWS
    ),
    zkConfigProvider: new FetchZkConfigProvider(
      opts.zkAssetsBaseUrl ?? (typeof window !== "undefined" ? window.location.origin : ""),
      typeof fetch !== "undefined" ? fetch.bind(globalThis) : undefined
    ),
    proofProvider: httpClientProofProvider(uris.proverServerUri ?? uris.proofServerUri ?? uris.prover),
    walletProvider: {
      coinPublicKey: state.coinPublicKey,
      encryptionPublicKey: state.encryptionPublicKey,
      balanceTx: (tx: unknown, newCoins: unknown) => wallet.balanceAndProveTransaction(tx, newCoins),
    },
    midnightProvider: {
      submitTx: (tx: unknown) => wallet.submitTransaction(tx),
    },
  };

  return { providers, wallet };
}

/** Populated by `configureProviders` so `LiveMidnightBackend` can call them. */
export const contractHelpers: {
  deployContract?: (...args: unknown[]) => Promise<unknown>;
  findDeployedContract?: (...args: unknown[]) => Promise<unknown>;
} = {};
