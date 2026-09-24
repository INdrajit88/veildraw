// Generates the "Sample Preprod Wallets (Generated, Off-Chain)" table in README.md.
//
// The addresses are sample/off-chain only (see the section's warning): each is a
// well-formed Midnight bech32m address (hrp `mn_addr_preprod`, 32-byte payload =
// sha256("veildraw-sample-preprod-<n>")) with zero on-chain activity. They are
// NOT scraped, NOT real users, and NOT funded — format practice data only.
//
// The script self-verifies: it decodes the real organizer address from the
// README to confirm the bech32m variant, then re-decodes every address it emits.
// Usage: node scripts/gen-sample-wallets.mjs
import { createHash } from 'node:crypto';

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32M_CONST = 0x2bc830a3;

function polymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((top >> i) & 1) chk ^= GEN[i];
  }
  return chk;
}

function hrpExpand(hrp) {
  const out = [];
  for (const c of hrp) out.push(c.charCodeAt(0) >> 5);
  out.push(0);
  for (const c of hrp) out.push(c.charCodeAt(0) & 31);
  return out;
}

function convertBits(data, from, to, pad) {
  let acc = 0;
  let bits = 0;
  const out = [];
  const maxv = (1 << to) - 1;
  for (const value of data) {
    acc = (acc << from) | value;
    bits += from;
    while (bits >= to) {
      bits -= to;
      out.push((acc >> bits) & maxv);
    }
  }
  if (pad && bits > 0) out.push((acc << (to - bits)) & maxv);
  return out;
}

function decode(address) {
  const pos = address.lastIndexOf('1');
  const hrp = address.slice(0, pos);
  const data = [...address.slice(pos + 1)].map((c) => CHARSET.indexOf(c));
  if (data.some((d) => d < 0)) return null;
  return polymod(hrpExpand(hrp).concat(data)) === BECH32M_CONST ? { hrp, data } : null;
}

function encode(hrp, payload) {
  const data = convertBits([...payload], 8, 5, true);
  const checksum = polymod(hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0])) ^ BECH32M_CONST;
  const combined = data.concat([(checksum >> 25) & 31, (checksum >> 20) & 31, (checksum >> 15) & 31, (checksum >> 10) & 31, (checksum >> 5) & 31, checksum & 31]);
  return `${hrp}1${combined.map((d) => CHARSET[d]).join('')}`;
}

// Ground the variant in reality: the README's organizer address must decode as bech32m.
const known = 'mn_addr_preview1lps20dj6gj6fdpnvlz7vj7tlqgdevrnewukkl656d5wl07ft95ksg42xe3';
if (!decode(known)) throw new Error('known organizer address failed bech32m decode — aborting');

const sha = (s) => createHash('sha256').update(s).digest();

for (let k = 1; k <= 50; k++) {
  const n = String(k).padStart(2, '0');
  const address = encode('mn_addr_preprod', sha(`veildraw-sample-preprod-${n}`));
  if (!decode(address)) throw new Error(`generated address ${n} failed re-decode — aborting`);
  console.log(`| ${n} | \`sample-preprod-${n}\` | \`${address}\` |`);
}
