// Verifies the deployed PGP contract state on the given network via the
// indexer, decoding it with the compiled contract's ledger reader.
// usage: node verify-deploy.mjs <contractAddressHex> <preview|preprod>
import { WebSocket } from 'ws';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { ledger, State } from '../contract/src/managed/pgp/contract/index.js';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';

globalThis.WebSocket = WebSocket;

const ADDRESS = process.argv[2];
const NETWORK = process.argv[3] ?? 'preview';
if (!ADDRESS) {
  console.error('usage: node verify-deploy.mjs <contractAddressHex> <preview|preprod>');
  process.exit(2);
}

setNetworkId(NETWORK);
const provider = indexerPublicDataProvider(
  `https://indexer.${NETWORK}.midnight.network/api/v4/graphql`,
  `wss://indexer.${NETWORK}.midnight.network/api/v4/graphql/ws`,
);

const clean = ADDRESS.replace(/^0x/, '');
const state = await provider.queryContractState(clean);
if (state == null) {
  console.error('contract state not found');
  process.exit(1);
}
const l = ledger(state.data);
console.log(JSON.stringify({
  network: NETWORK,
  giveawayState: State[l.giveawayState],
  title: l.title.value,
  prizeDetails: l.prizeDetails.value,
  organizerPk: toHex(l.organizerPk),
  entryCount: l.entryCount.toString(),
  entryAccumulator: toHex(l.entryAccumulator),
  winningCommitment: toHex(l.winningCommitment),
  winnerClaimed: l.winnerClaimed,
}, null, 2));
process.exit(0);
