// Single source of truth for the active Midnight network, derived at build
// time from NEXT_PUBLIC_NETWORK_ID (set via build:preview / build:preprod).

const rawId = process.env.NEXT_PUBLIC_NETWORK_ID || 'preprod';

export const networkId: string = rawId;

export const networkLabel: string = `${rawId.charAt(0).toUpperCase()}${rawId.slice(1)} Remote`;

export const networkBadge: string = `${rawId.charAt(0).toUpperCase()}${rawId.slice(1)} Testnet`;

export const networkCapitalized: string = `${rawId.charAt(0).toUpperCase()}${rawId.slice(1)}`;

export const cliCommand: string = `cd pgp-cli && npm run ${rawId}-remote`;

export const rpcNodeUrl: string = `https://rpc.${rawId}.midnight.network`;

export const indexerUrl: string = `https://indexer.${rawId}.midnight.network/api/v4/graphql`;

export const indexerWsUrl: string = `wss://indexer.${rawId}.midnight.network/api/v4/graphql/ws`;

export const addressPlaceholder: string = `mn_addr_${rawId}1...`;
