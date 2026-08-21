#!/usr/bin/env bash
# One-command PGP contract deployment for Midnight Preprod
# Usage: ./deploy.sh
#
# Prerequisites:
#   - Docker running (for proof server)
#   - Midnight Preprod faucet online
#
# After deployment, copy the printed contract address into README.md

set -euo pipefail

echo "Starting PGP Proof Server..."
docker run -d --name pgp-proof-server --rm -p 6300:6300 -e PORT=6300 midnightntwrk/proof-server:8.1.0 2>/dev/null || echo "Proof server already running"
sleep 3

echo "Waiting for proof server to be ready..."
for i in {1..30}; do
  if curl -sf http://localhost:6300/health >/dev/null 2>&1; then
    echo "Proof server ready."
    break
  fi
  sleep 1
done

echo ""
echo "Starting PGP CLI on Preprod Remote..."
echo "The CLI is interactive. Choose:"
echo "  1) Build wallet from a seed (if you have a funded seed)"
echo "  2) Build a fresh wallet (faucet must be online)"
echo "  3) Deploy a new Giveaway contract"
echo ""

cd "$(dirname "$0")/pgp-cli"
NODE_OPTIONS="--max-old-space-size=8192" npm run preprod-remote

echo ""
echo "============================================================"
echo "After deploying, copy the printed contract address from the"
echo "log line 'Deployed PGP contract at address: <HEX>' and paste"
echo "it into the README contract address table."
echo "============================================================"
