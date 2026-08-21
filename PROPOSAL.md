# PGP (Private Giveaway Platform) - Proposal

**Project**: `pgp` - Zero-Knowledge Private Giveaway Platform on Midnight Network
**Network**: Midnight Preprod Remote (tNIGHT)
**Smart Contract Language**: Compact v0.23

---

## Problem

Modern giveaways — crypto airdrops, community raffles, promotional draws — force participants to publicly expose their wallet addresses, email, or social identities just to enter. Every participant list becomes a permanent privacy leak:

- Wallet addresses are harvested for **sybil farming** and **targeted spam**.
- Losing entries are exposed alongside winners, leaking participant identity.
- Organizers become custodians of sensitive data lists that must be protected and later purged.
- On transparent blockchains, the full entry list is written permanently and publicly.

There is no giveaway flow that can prove a valid winner was selected without disclosing who entered or who lost.

## Proposed Solution

`pgp` turns giveaway participation into a **portable zero-knowledge proof**: a participant registers an opaque commitment once, and when the winner is drawn, they prove they hold the winning ticket without revealing their secret key or identifying any losing entry.

The ledger learns only that a valid winner claimed the prize. Participant identities, nonces, random seeds, and unselected entries never reach the chain.

### Core Privacy Properties

- **Entry Anonymity**: Only an untraceable commitment hash is written on-chain; the participant's wallet address is never published.
- **Losing-Entry Hiding**: Neither the organizer nor the ledger ever observes the set of non-winning ticket secrets.
- **Single-Claim Enforcement**: The `winnerClaimed` flag prevents double-claiming without exposing the winner's identity.
- **Organizer Authenticity**: `closeAndSelectWinner` and `cancelGiveaway` require a ZK witness matching the organizer's originally published public key.

## Architecture

A single `pgp.compact` contract deployed to Midnight Preprod exposes five circuits:

| Circuit | Privacy Role |
|:---|:---|
| `createGiveaway` | Binds `organizerPk` via a ZK witness to `localSecretKey()`. |
| `enterGiveaway` | Appends `persistentHash([prefix, count, commitment])` to the accumulator; raw commitment stays local. |
| `closeAndSelectWinner` | Verifies organizer witness, then publishes only the winning commitment hash. |
| `claimPrize` | Proves `persistentHash([claim, ticketSecret, localSecretKey]) == winningCommitment` in ZK. |
| `cancelGiveaway` | Verifies organizer witness to cancel; no secrets disclosed. |

### Stack

- **Contract**: Compact v0.23, compiled via `compactc`, proof generation via `midnightntwrk/proof-server:8.1.0`.
- **API Layer** (`@midnight-ntwrk/pgp-api`): TypeScript adapter exposing observable state and a typed transaction interface.
- **Web DApp** (`@midnight-ntwrk/pgp-ui`): React 19 + Vite + Zustand, with in-memory private state; no custodial wallet.
- **CLI** (`@midnight-ntwrk/pgp-cli`): Interactive headless client for deployment, automated tests, and faucet-driven dust generation.

### Local Privacy State (Kachina)

Participant secret key, nonce, and ticket secret are stored locally in a LevelDB private state provider. The `disclose()` discipline in Compact explicitly lists every ledger output; the compiler rejects accidental witness leakage at build time.

## Success Criteria

1. A participant can enter a giveaway from the browser DApp with the ledger receiving only the commitment hash.
2. An organizer can draw a winning commitment off-chain and post it on-chain, with the ledger verifying the organizer witness.
3. The winner can submit their ticket secret to the circuit and have the ledger verify `computedWinnerCommitment == winningCommitment` without publishing the secret.
4. A non-winner cannot claim the prize — the ZK proof rejects invalid ticket secrets.
5. The organizer cannot cancel after a prize is claimed (`State.COMPLETED`).
6. All state transitions are observable on the Midnight preprod indexer, and no raw private state material appears in any GraphQL query.

## Out of Scope (Current Build)

- **Off-chain sybil defense**: Anti-sybil verification (preventing one user from rolling multiple seeds) is delegated to wallet authentication or external identity gates.
- **Multi-tier winners**: Each deployed contract instance supports one canonical winner; multi-winner giveaways require deploying one contract per prize tier.
- **Escrow / prize custody**: Prize transfer is performed off-chain or via a separate token contract; `pgp` only proves claim eligibility.

## Deliverables

| Artifact | Description |
|:---|:---|
| `contract/src/pgp.compact` | Compact source and state schema |
| `contract/src/managed/pgp` | Compiled ZK artifacts |
| `api/` | `PGPAPI` TypeScript adapter |
| `pgp-ui/` | Glassmorphism React web DApp |
| `pgp-cli/` | Headless interactive CLI with preprod/preview/standalone configs |
| `docs/screenshots/` | End-to-end visual walkthrough |
| Live deployment | `https://pgpapp.vercel.app/` |

## Evaluation

Reviewers should:

1. Clone the repo, run `npm install && npm run build`, and confirm all three workspaces compile.
2. Launch the web DApp (`cd pgp-ui && npm run dev`) and walk through the entry → draw → claim flow.
3. Run the CLI against preprod remote (`cd pgp-cli && npm run preprod-remote`) and reproduce the organizer-participant dance end to end.
4. Inspect the contract state via the Midnight preprod indexer and verify that no raw ticket secret, nonce, or private key material is present.

## Risks

- **Compact compiler evolution**: The circuit depends on specific Midnight SDK versions; major Compact revisions may require porting the state schema.
- **Faucet reliability**: Preprod faucet availability directly gates end-to-end CLI testing.
- **Indexer latency**: ZK transactions on preprod can take several seconds to be indexed; UI retries mask this.
