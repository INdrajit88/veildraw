// Find the deploy transaction + block for a contract address via contractActions subscription.
// usage: node find-deploy-tx.mjs <contractAddressHex> <preview|preprod>
import { WebSocket } from 'ws';

const ADDRESS = process.argv[2]?.replace(/^0x/, '');
const NETWORK = process.argv[3] ?? 'preview';
if (!ADDRESS) {
  console.error('usage: node find-deploy-tx.mjs <contractAddressHex> <preview|preprod>');
  process.exit(2);
}

const ws = new WebSocket(`wss://indexer.${NETWORK}.midnight.network/api/v4/graphql/ws`, 'graphql-transport-ws');

const QUERY = `subscription($address: HexEncoded!) {
  contractActions(address: $address) {
    __typename
    address
    transaction { hash block { height timestamp } }
  }
}`;

let found = false;
const timeout = setTimeout(() => {
  if (!found) console.log('RESULT: no contract actions streamed within timeout.');
  ws.close();
  process.exit(found ? 0 : 1);
}, 30000);

ws.on('open', () => ws.send(JSON.stringify({ type: 'connection_init', payload: {} })));
ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  if (msg.type === 'connection_ack') {
    ws.send(JSON.stringify({ id: '1', type: 'subscribe', payload: { query: QUERY, variables: { address: ADDRESS } } }));
  } else if (msg.type === 'next') {
    const ev = msg.payload.data?.contractActions;
    if (ev) {
      found = true;
      console.log('ACTION:', JSON.stringify(ev).slice(0, 800));
    } else {
      console.log('NEXT:', JSON.stringify(msg.payload).slice(0, 400));
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
