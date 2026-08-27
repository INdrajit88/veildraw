// Expect-style driver for the interactive PREVIEW CLI.
// Fresh wallet -> wait for faucet funds -> deploy new contract -> createGiveaway -> exit.
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const LOG = '/tmp/pgp-deploy-preview.log';
const ADDR_FILE = '/tmp/pgp-preview-contract-address';
const SEED_FILE = '/tmp/pgp-preview-seed.txt';
// Reuse the previously-created wallet whose address is already funded on Preview.
const WALLET_SEED = fs.readFileSync(SEED_FILE, 'utf8').trim();
const GIVEAWAY_TITLE = 'VeilDraw Preview Giveaway';
const GIVEAWAY_PRIZE = '5,000 tNIGHT';
const MAX_MS = 45 * 60 * 1000;

fs.writeFileSync(LOG, '');
fs.writeFileSync(ADDR_FILE, '');

const child = spawn('npm', ['run', 'preview-remote'], {
  cwd: '/Users/indrajitari/Projects/midnight/pgpapp/pgp-cli',
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' },
});
const out = fs.createWriteStream(LOG, { flags: 'a' });
child.stdout.pipe(out, { end: false });
child.stderr.pipe(out, { end: false });

let stage = 0;

const send = (s) => {
  console.log('>> sending:', s);
  child.stdin.write(s + '\n');
};

const readLog = () => {
  try {
    return fs.readFileSync(LOG, 'utf8');
  } catch {
    return '';
  }
};

const finish = (code, message) => {
  console.log(message);
  clearInterval(timer);
  try {
    child.kill('SIGTERM');
  } catch {
    // already gone
  }
  setTimeout(() => process.exit(code), 5000);
};

const started = Date.now();
const timer = setInterval(() => {
  const log = readLog();

  if (Date.now() - started > MAX_MS) {
    finish(2, 'WATCHDOG: overall timeout exceeded; aborting.');
    return;
  }

  if (log.includes('"level":50')) {
    const errorLine = log
      .split('\n')
      .filter((l) => l.includes('"level":50'))
      .pop();
    finish(1, `CLI reported an error: ${errorLine}`);
    return;
  }

  if (stage === 0 && log.includes('PGP Wallet Setup')) {
    stage = 1;
    send('2'); // build wallet from the saved (already-funded) seed
  } else if (stage === 1 && log.includes('Enter your wallet seed:')) {
    stage = 2;
    send(WALLET_SEED);
  } else if (stage === 2 && log.includes('Your NIGHT wallet balance is:')) {
    stage = 3;
    console.log('Funds detected; waiting for dust generation and main menu...');
  } else if (stage === 3 && log.includes('Private Giveaway Platform (PGP) - Main Menu')) {
    stage = 4;
    send('1'); // deploy a new contract
  } else if (stage === 4) {
    const m = log.match(/Deployed PGP contract at address: (\S+)/);
    if (m) {
      fs.writeFileSync(ADDR_FILE, m[1]);
      console.log('CONTRACT ADDRESS:', m[1]);
      stage = 5;
    }
  } else if (stage === 5 && log.includes('Which action would you like to perform?')) {
    stage = 6;
    send('1'); // create a giveaway
  } else if (stage === 6 && log.includes('Enter Giveaway Title')) {
    stage = 7;
    send(GIVEAWAY_TITLE);
  } else if (stage === 7 && log.includes('Enter Prize Details')) {
    stage = 8;
    send(GIVEAWAY_PRIZE);
  } else if (stage === 8 && log.includes('Giveaway successfully created on-chain!')) {
    finish(0, 'SUCCESS: contract deployed and giveaway created on preview.');
  }
}, 3000);

child.on('exit', (code) => {
  if (stage < 8) {
    finish(1, `CLI exited early with code ${code} at stage ${stage}`);
  }
});
