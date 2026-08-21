// Expect-style driver for the interactive preview CLI.
// Watches the CLI log and feeds stdin answers when prompts appear.
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const seed = fs.readFileSync('/tmp/pgp-seed.txt', 'utf8').trim();
const LOG = '/tmp/pgp-deploy-preview.log';
fs.writeFileSync(LOG, '');

const child = spawn('npm', ['run', 'preview-remote'], {
  cwd: '/Users/indrajitari/Projects/midnight/pgpapp/pgp-cli',
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' },
});
const out = fs.createWriteStream(LOG, { flags: 'a' });
child.stdout.pipe(out, { end: false });
child.stderr.pipe(out, { end: false });
child.on('exit', (code) => {
  console.log('CLI exited with', code);
  process.exit(0);
});

let stage = 0;
const contractAddress = fs.readFileSync('/tmp/pgp-contract-address', 'utf8').trim();
const send = (s) => {
  console.log('>> sending:', s.slice(0, 20));
  child.stdin.write(s + '\n');
};

const timer = setInterval(() => {
  let log = '';
  try {
    log = fs.readFileSync(LOG, 'utf8');
  } catch {
    return;
  }
  if (stage === 0 && log.includes('Which would you like to do?')) {
    send('2');
    send(seed);
    stage = 1;
  } else if (
    stage === 1 &&
    (log.includes('waiting for funds') ||
      log.includes('skipping wait for unshielded funds'))
  ) {
    const m = log.match(/Using unshielded address: (\S+) waiting/);
    if (m) fs.writeFileSync('/tmp/pgp-faucet-address', m[1]);
    stage = 2;
  } else if (
    stage === 2 &&
    log.includes('Private Giveaway Platform (PGP) - Main Menu')
  ) {
    send('2'); // join the already-deployed contract
    stage = 3;
  } else if (stage === 3 && log.includes('Enter PGP Contract address (hex):')) {
    send(contractAddress);
    stage = 4;
  } else if (
    stage === 4 &&
    log.includes('Which action would you like to perform?')
  ) {
    send('1'); // create a giveaway
    stage = 5;
  } else if (stage === 5 && log.includes('Enter Giveaway Title')) {
    send('PGP Launch Giveaway');
    stage = 6;
  } else if (stage === 6 && log.includes('Enter Prize Details')) {
    send('5,000 tNIGHT');
    stage = 7;
  } else if (stage === 7 && log.includes('successfully created')) {
    send('6'); // exit main loop
    stage = 8;
    setTimeout(() => process.exit(0), 5000);
  }
}, 2000);
