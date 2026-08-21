// Wallet connector implementing the Midnight DApp Connector API (CAIP-372 draft).
// Wallets inject an InitialAPI under `window.midnight` (keyed by UUID) exposing
// `connect(networkId) => Promise<ConnectedAPI>`. The ConnectedAPI provides addresses
// and balances exclusively via async methods (getUnshieldedAddress, getShieldedAddresses,
// getShieldedBalances, ...). Legacy sync-property providers are supported as a fallback.
// Never returns fabricated addresses.

declare global {
  interface Window {
    midnight?: Record<string, any>;
    cardano?: Record<string, any>;
  }
}

import { networkCapitalized, networkLabel, networkId } from '@/lib/network';

export interface WalletDetectionResult {
  isLaceInstalled: boolean;
  is1AMInstalled: boolean;
  laceProvider: any | null;
  oneAMProvider: any | null;
}

const NETWORK_ID = (): string => networkId;

function injectedApis(): any[] {
  if (typeof window === 'undefined') return [];
  const candidates = [...Object.values(window.midnight ?? {}), ...Object.values(window.cardano ?? {})];
  return candidates.filter((c) => c && typeof c === 'object');
}

function matchesWallet(api: any, kind: 'lace' | '1am'): boolean {
  const hay = `${api?.rdns ?? ''} ${api?.name ?? ''}`.toLowerCase();
  if (kind === 'lace') return hay.includes('lace');
  return hay.includes('1am') || hay.includes('oneam') || hay.includes('1-am');
}

export function detectMidnightWallets(): WalletDetectionResult {
  if (typeof window === 'undefined') {
    return { isLaceInstalled: false, is1AMInstalled: false, laceProvider: null, oneAMProvider: null };
  }

  const injected = injectedApis();
  const laceProvider =
    injected.find((a) => matchesWallet(a, 'lace')) ??
    window.midnight?.lace ??
    window.midnight?.['midnight-lace'] ??
    window.cardano?.lace ??
    null;
  const oneAMProvider =
    injected.find((a) => matchesWallet(a, '1am')) ??
    window.midnight?.['1am'] ??
    window.midnight?.['midnight-1am'] ??
    window.midnight?.oneAM ??
    window.cardano?.['1am'] ??
    null;

  return {
    isLaceInstalled: !!laceProvider,
    is1AMInstalled: !!oneAMProvider,
    laceProvider,
    oneAMProvider,
  };
}

/** Connect an InitialAPI (or legacy provider) and return the connected API object. */
async function connectProvider(provider: any): Promise<any> {
  if (typeof provider?.connect === 'function') {
    console.log('[Wallet] Calling connect(networkId)...', NETWORK_ID());
    return provider.connect(NETWORK_ID());
  }
  if (typeof provider?.enable === 'function') {
    console.log('[Wallet] Calling enable()...');
    return provider.enable();
  }
  if (typeof provider === 'function') {
    console.log('[Wallet] Calling provider as function...');
    return provider();
  }
  console.log('[Wallet] Using provider directly');
  return provider;
}

/** DApp Connector API: addresses are async methods returning bech32m strings. */
async function extractConnectorAddress(api: any): Promise<string | null> {
  if (typeof api?.getUnshieldedAddress === 'function') {
    try {
      const res = await api.getUnshieldedAddress();
      if (res?.unshieldedAddress) {
        console.log('[Wallet] getUnshieldedAddress():', res.unshieldedAddress.substring(0, 24));
        return res.unshieldedAddress;
      }
    } catch (e) {
      console.log('[Wallet] getUnshieldedAddress() failed:', e);
    }
  }
  if (typeof api?.getShieldedAddresses === 'function') {
    try {
      const res = await api.getShieldedAddresses();
      const addr = res?.shieldedAddress ?? res?.shieldedCoinPublicKey;
      if (addr) {
        console.log('[Wallet] getShieldedAddresses():', String(addr).substring(0, 24));
        return addr;
      }
    } catch (e) {
      console.log('[Wallet] getShieldedAddresses() failed:', e);
    }
  }
  return null;
}

/** Legacy providers exposed synchronous address properties. */
function extractLegacyAddress(api: any): string | null {
  if (!api) return null;
  const direct =
    api.address ?? api.coinPublicKey ?? api.publicAddress ?? api.accountAddress ?? api.unshieldedAddress;
  if (direct) return direct;
  if (api.state && typeof api.state === 'object') {
    const s =
      api.state.address ??
      api.state.coinPublicKey ??
      api.state.publicAddress ??
      api.state.accountAddress ??
      api.state.unshieldedAddress;
    if (s) return s;
  }
  if (api.wallet && typeof api.wallet === 'object') {
    const w = api.wallet.address ?? api.wallet.coinPublicKey ?? api.wallet.publicAddress;
    if (w) return w;
  }
  return null;
}

/** Format a bigint token amount (6 decimals) for display. */
function formatTokenAmount(value: bigint): string {
  const whole = value / 1_000_000n;
  const frac = value % 1_000_000n;
  const fracStr = frac.toString().padStart(6, '0').slice(0, 2);
  return `${whole.toString()}.${fracStr}`;
}

async function fetchBalance(api: any): Promise<string> {
  if (!api) return '--';
  try {
    if (typeof api.getShieldedBalances === 'function') {
      const balances = await api.getShieldedBalances();
      const entries = Object.entries(balances ?? {});
      if (entries.length > 0) {
        return entries.map(([token, amount]) => `${formatTokenAmount(BigInt(amount as any))} ${token}`).join(', ');
      }
    }
    if (typeof api.getUnshieldedBalances === 'function') {
      const balances = await api.getUnshieldedBalances();
      const entries = Object.entries(balances ?? {});
      if (entries.length > 0) {
        return entries.map(([token, amount]) => `${formatTokenAmount(BigInt(amount as any))} ${token}`).join(', ');
      }
    }
  } catch (e) {
    console.log('[Wallet] balance fetch failed:', e);
  }
  if (typeof api.balance === 'function') {
    try {
      const bal = await api.balance();
      if (bal != null) return typeof bal === 'string' ? bal : bal.toString();
    } catch {
      // ignore
    }
  }
  return '--';
}

export async function connectMidnightWallet(
  providerType: 'lace' | '1am' | 'seed',
  seedPhrase?: string,
): Promise<{ address: string; network: string; balance: string }> {
  const detection = detectMidnightWallets();

  if (providerType === 'lace' || providerType === '1am') {
    const label = providerType === 'lace' ? 'Lace' : '1AM';
    const provider = providerType === 'lace' ? detection.laceProvider : detection.oneAMProvider;
    if (!provider) {
      throw new Error(`${label} Wallet extension is not installed. Install it from your browser store.`);
    }
    try {
      console.log(`[${label}] Resolving wallet API...`);
      const api = await connectProvider(provider);
      console.log(`[${label}] API resolved, extracting address...`);

      // ConnectedAPI: async address methods. Legacy: sync props (possibly behind state()).
      const resolvedApi = typeof api?.state === 'function' ? await api.state().catch(() => api) : api;
      const address = (await extractConnectorAddress(resolvedApi)) ?? extractLegacyAddress(resolvedApi);

      if (!address) {
        throw new Error(
          `${label} Wallet returned no address. Ensure it is unlocked, set to ${networkCapitalized} network, and has completed initial setup.`,
        );
      }

      console.log(`[${label}] Address extracted:`, address);
      const balance = await fetchBalance(resolvedApi);
      return {
        address,
        network: networkLabel,
        balance,
      };
    } catch (err: any) {
      console.error(`[${label}] Connection error:`, err);
      throw new Error(err?.message || `${label} Wallet authorization declined.`);
    }
  }

  if (providerType === 'seed') {
    if (!seedPhrase || seedPhrase.trim().length < 12) {
      throw new Error('Please enter a valid 12 or 24 word seed phrase.');
    }
    throw new Error(
      'Seed-based wallet import is not yet supported in-browser. Use the CLI (`cd pgp-cli && npm run ' +
        NETWORK_ID() +
        '-remote`) to import a seed wallet locally.',
    );
  }

  throw new Error('Unsupported wallet provider type.');
}
