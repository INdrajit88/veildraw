// On-chain check: does the given network's chain hold any unshielded
// transaction for an address? Uses the same indexer subscription the wallet uses.
// usage: node check-funds.mjs <mn_addr_...> <preprod|preview> [timeoutMs]
import { WebSocket } from 'ws';
import { MidnightBech32m, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';

const BECH32 = process.argv[2];
const NETWORK = process.argv[3] ?? 'preprod';
if (!BECH32) {
  console.error('usage: node check-funds.mjs <mn_addr_...> <preprod|preview> [timeoutMs]');
  process.exit(2);
}

const WS_URL = `wss://indexer.${NETWORK}.midnight.network/api/v4/graphql/ws`;

const decoded = MidnightBech32m.parse(BECH32).decode(UnshieldedAddress, NETWORK);
console.log('network:', NETWORK, '| address hex:', Buffer.from(decoded.data).toString('hex'));

const ws = new WebSocket(WS_URL, 'graphql-transport-ws');

const QUERY = `subscription($address: UnshieldedAddress!) {
  unshieldedTransactions(address: $address) {
    __typename
    ... on UnshieldedTransaction {
      transaction {
        __typename
        id
        hash
        block { height timestamp }
      }
      createdUtxos { owner value tokenType outputIndex registeredForDustGeneration }
    }
    ... on UnshieldedTransactionsProgress {
      highestTransactionId
    }
  }
}`;

let sawData = false;
const timeout = setTimeout(() => {
  console.log(sawData ? 'DONE: transactions above were found (funds ON chain).' : 'RESULT: no unshielded transactions found (funds NOT on chain).');
  ws.close();
  process.exit(sawData ? 0 : 1);
}, Number(process.argv[4] ?? 30000));

ws.on('open', () => ws.send(JSON.stringify({ type: 'connection_init', payload: {} })));
ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  if (msg.type === 'connection_ack') {
    ws.send(JSON.stringify({ id: '1', type: 'subscribe', payload: { query: QUERY, variables: { address: BECH32 } } }));
  } else if (msg.type === 'next') {
    const ev = msg.payload.data?.unshieldedTransactions;
    if (ev?.__typename === 'UnshieldedTransaction') {
      sawData = true;
      console.log('TX FOUND:', JSON.stringify(ev).slice(0, 1500));
    } else if (ev?.__typename === 'UnshieldedTransactionsProgress') {
      console.log('progress: highestTransactionId =', ev.highestTransactionId);
    } else {
      console.log('NEXT payload:', JSON.stringify(msg.payload).slice(0, 800));
    }
  } else if (msg.type === 'error') {
    console.log('subscription error:', JSON.stringify(msg.payload));
  } else if (msg.type === 'complete') {
    console.log('subscription complete');
  }
});
ws.on('error', (e) => {
  console.log('ws error:', e.message);
  clearTimeout(timeout);
  process.exit(1);
});
