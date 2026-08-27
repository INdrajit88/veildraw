# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Rewrote the `pgp.compact` smart contract (same public interface — all circuits, ledger fields, and witnesses unchanged). Fixed the `entryCount` off-by-one (a fresh giveaway now starts at 0 entries instead of 1), added a re-initialization guard to `createGiveaway`, hardened asserts, and documented the privacy model inline. Recompiled all ZK artifacts with `compactc` 0.31.1.

### Added

- Deployed the rewritten contract to the Midnight **Preview** testnet at `0ec3244220040ce3538fd34bb22d6de29a2174bdb7d94b3f52ffc18829ef1fba` (deploy tx `4dea31dc…`, block 606,152) with an active `VeilDraw Preview Giveaway` (5,000 tNIGHT).
- CLI deploy/ops helpers in `pgp-cli/`: `deploy-driver-preview.mjs`, `deploy-driver-preprod.mjs`, `check-funds.mjs`, `verify-deploy.mjs`, `find-deploy-tx.mjs`.

### Known Issues

- Midnight **Preprod** deployment remains on standby: wallet-sdk exhausts memory syncing the Preprod ledger on a 16GB laptop (JavaScript heap out of memory), confirming the existing Preprod limitation. Preview is used instead.
