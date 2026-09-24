// Regenerates the "Demo & Test Accounts (Sample Data)" table in README.md.
//
// The values are sample/off-chain only (see the section's warning): secrets and
// nonces are deterministic sha256 derivations, and the commitment column mirrors
// the local-only preview formula in pgp-ui/components/views/GiveawayPortal.tsx.
// Usage: node scripts/gen-demo-table.mjs
import { createHash } from 'node:crypto';

function previewCommitment(secret, nonce) {
  const source = `${secret}:${nonce}`;
  let hex = '';
  for (let i = 0; i < 64; i++) {
    const c = source.charCodeAt(i % source.length);
    hex += '0123456789abcdef'[(c * (i + 7)) % 16];
  }
  return hex;
}

const sha = (s) => createHash('sha256').update(s).digest('hex');

for (let k = 1; k <= 20; k++) {
  const n = String(k).padStart(2, '0');
  const secret = sha(`veildraw-demo-secret-${n}`);
  const nonce = sha(`veildraw-demo-nonce-${n}`).slice(0, 16);
  console.log(`| ${n} | \`demo-user-${n}\` | \`${secret}\` | \`${nonce}\` | \`${previewCommitment(secret, nonce)}\` |`);
}
