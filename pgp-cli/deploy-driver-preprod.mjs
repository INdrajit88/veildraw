// Expect-style driver for the interactive preprod CLI.
// Reuses the funded wallet seed, then: deploy -> createGiveaway -> exit.
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const LOG = '/tmp/pgp-deploy-preprod.log';
const ADDR_FILE = '/tmp/pgp-preprod-contract-address';
// Reuse a previously-funded preprod wallet. The seed is read from a local
// file (never committed); store the 64-hex seed there before running.
const SEED_FILE = process.env.PGP_PREPROD_SEED_FILE ?? '/tmp/pgp-preprod-seed.txt';
let WALLET_SEED = '';
try {
  WALLET_SEED = fs.readFileSync(SEED_FILE, 'utf8').trim();
} catch {
  console.error(`No wallet seed found at ${SEED_FILE}. Write the 64-hex seed to that file (or set PGP_PREPROD_SEED_FILE) and re-run.`);
  process.exit(2);
}
const GIVEAWAY_TITLE = 'PGP Preprod Launch Giveaway';
const GIVEAWAY_PRIZE = '5,000 tNIGHT';
const MAX_MS = 60 * 60 * 1000;

fs.writeFileSync(LOG, '');
fs.writeFileSync(ADDR_FILE, '');

const child = spawn('npm', ['run', 'preprod-remote'], {
  cwd: '/Users/indrajitari/Projects/midnight/pgpapp/pgp-cli',
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' },

});
const out = fs.createWriteStream(LOG, { flags: 'a' });
child.stdout.pipe(out, { end: false });
child.stderr.pipe(out, { end: false });

let stage = 0;

const send = (s) => {
  console.log('>> sending:', s === WALLET_SEED ? '<wallet seed>' : s);
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
    send('2'); // build wallet from a seed
  } else if (stage === 1 && log.includes('Enter your wallet seed:')) {
    stage = 2;
    send(WALLET_SEED);
  } else if (stage === 2 && log.includes('Your NIGHT wallet balance is:')) {
    stage = 3;
    console.log('Funds detected; running dust generation (this takes several minutes on Preprod)...');

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
    finish(0, 'SUCCESS: contract deployed and giveaway created on preprod.');
  }
}, 3000);

child.on('exit', (code) => {
  if (stage < 8) {
    finish(1, `CLI exited early with code ${code} at stage ${stage}`);
  }
});
