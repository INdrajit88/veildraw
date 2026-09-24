<div align="center">

# VeilDraw — Private Giveaway Platform

### Zero-Knowledge Proof Giveaways on Midnight

[![CI](https://img.shields.io/github/actions/workflow/status/INdrajit88/veildraw/ci.yml?branch=main&label=CI&style=flat-square)](https://github.com/INdrajit88/veildraw/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D24.11.1-brightgreen?style=flat-square)](https://nodejs.org)
[![Midnight Preview](https://img.shields.io/badge/Midnight-Preview_Testnet-8B5CF6?style=flat-square)](https://docs.midnight.network)
[![Rise In](https://img.shields.io/badge/Rise_In-New_Moon_to_Full_·_Level_3-0ea5e9?style=flat-square)](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight)
[![X (Twitter)](https://img.shields.io/badge/X-@VeilDraww-black?style=flat-square&logo=x)](https://x.com/VeilDraww)

**Giveaways without exposing your identity.** Organizers escrow prizes in a Compact smart contract, participants enter with locally-generated ZK commitments, and winners claim by proving ticket ownership in zero knowledge — no wallet addresses, identities, or entry lists are ever published on-chain.

[**Live dApp →**](https://veildraw-pgp-ui.vercel.app/) · [**Video walkthrough →**](https://youtu.be/meczmnhMPWo) · [**Contract on Preview →**](#on-chain-deployment)

</div>

---

## Contents

- [Overview](#overview)
- [Privacy Model](#privacy-model)
- [How It Works](#how-it-works)
- [Protocol Feedback Loop](#protocol-feedback-loop)
- [User Feedback](#user-feedback)
- [App Screenshots](#app-screenshots)
- [On-Chain Deployment](#on-chain-deployment)
- [App Architecture](#app-architecture)
- [Quick Start](#quick-start)
- [Repository and Links](#repository-and-links)

---

## Overview

VeilDraw is a privacy-preserving giveaway platform built on [Midnight](https://midnight.network). Organizers escrow prizes in a Compact smart contract; participants enter with locally-generated ZK commitments; winners claim prizes by proving ticket ownership in zero knowledge — no wallet addresses, identities, or entry lists are ever published on-chain.

The frontend is a premium **Next.js 15** static dApp (React 19, Tailwind, Framer Motion, shadcn/ui) with an immersive scroll-driven 3D story. It reads live state from the Midnight indexer and connects to Lace / 1AM wallets through the official DApp Connector API (CAIP-372).

This project is deployed against the **Midnight Preview Testnet** and is submitted for the **Rise In × Midnight "New Moon to Full" program — Level 3 (First Quarter): Production-Grade dApp**.

### Live Demo and Quick Links

| Resource | Link | Description |
|:---|:---|:---|
| **Live dApp** | [veildraw-pgp-ui.vercel.app](https://veildraw-pgp-ui.vercel.app/) | Next.js 15 ZK giveaway dApp on Midnight Preview |
| **Giveaway Portal** | [veildraw-pgp-ui.vercel.app/giveaways](https://veildraw-pgp-ui.vercel.app/giveaways) | Browse & enter active zero-knowledge giveaways |
| **Organizer Console** | [veildraw-pgp-ui.vercel.app/organizer](https://veildraw-pgp-ui.vercel.app/organizer) | Create giveaways & draw winners via ZK witness |
| **Winner Verification** | [veildraw-pgp-ui.vercel.app/verify](https://veildraw-pgp-ui.vercel.app/verify) | Verify ticket secrets & claim prizes on-chain |
| **Analytics & Telemetry** | [veildraw-pgp-ui.vercel.app/analytics](https://veildraw-pgp-ui.vercel.app/analytics) | Real-time indexer stats & proof performance |
| **Video Walkthrough** | [YouTube Demo](https://youtu.be/meczmnhMPWo) | End-to-end walkthrough video |
| **Midnight Preview Faucet** | [faucet.preview.midnight.network](https://faucet.preview.midnight.network/) | Get testnet tNIGHT tokens |
| **Official X (Twitter)** | [@VeilDraww](https://x.com/VeilDraww) | Official project updates & announcements |

---

## User Feedback

We actively collect product feedback from users, testers, and community members to improve the experience and prioritize the next iteration.

- **Feedback Form:** [Google Form](https://forms.gle/HAgcKRcYHsdhM98Z9)
- **Feedback Spreadsheet:** [User Feedback Tracker](https://docs.google.com/spreadsheets/d/12_wo1pkArdF5-j2_LvKGpiHiZExpY--uO0Sw5xErdG8/edit?resourcekey=&gid=37793418#gid=37793418)

Please submit bug reports, usability feedback, feature ideas, and testing notes via the form, then track responses in the shared spreadsheet.

---

## Privacy Model

The contract maintains a ZK accumulator tree of private entry commitments and accepts a private witness (ticket secret) that must match the organizer-selected winning commitment before the prize can be claimed.

| | What it includes |
|:---|:---|
| **PUBLIC** (on-chain, visible to anyone) | The entry accumulator state, entry count, winning commitment hash, and winner-claimed status |
| **PRIVATE** (local witness, never published) | The participant's ticket secret, nonce, and secret key — generated and held on the user's device |
| **PROVEN without revealing** | That the ticket secret hashes to the winning commitment and the claim transition is valid — via `persistentHash` inside the ZK circuit |

The UI surfaces proof status and on-chain results only; raw secrets never leave the device.

---

## How It Works

```mermaid
sequenceDiagram
  actor O as Organizer
  actor P as Participant
  actor W as Winner
  actor V as Verifier
  participant CLI as pgp-cli + proof server
  participant UI as VeilDraw (browser)
  participant C as VeilDraw Contract (on-chain)

  O->>CLI: deploy + createGiveaway(title, prize)
  CLI->>C: escrow prize, open entries
  P->>P: generate ticket secret locally
  P->>UI: connect wallet, enter giveaway
  UI->>C: enterGiveaway — only hash(secret, nonce) published
  O->>CLI: closeAndSelectWinner(winningCommitment)
  CLI->>C: disclose winning commitment hash
  W->>UI: claimPrize with private ticket secret
  UI->>C: ZK proof: hash(secret) == winningCommitment
  C-->>W: prize released — no address linkage on-chain
  V->>UI: enter ticket to verify
  V->>C: compare disclosed commitment on-chain
```

1. **Organizer** deploys the contract and creates a giveaway; the prize is escrowed.
2. **Participant** connects Lace/1AM, generates a ticket secret in-browser, and submits only the commitment hash.
3. **Organizer** closes entries and selects the winning commitment off-chain.
4. **Winner** proves ticket ownership in zero knowledge and claims — the chain never learns which address won.
5. **Verifier** (anyone) can independently confirm a winning ticket against the disclosed commitment.

---

## Protocol Feedback Loop

Every stage of a giveaway writes its result back into on-chain state, and the indexer streams that state back to every client — so participants, organizers, and verifiers always act on the same live truth:

```mermaid
flowchart TD
  A["1 · ENTER — participant submits hash(secret, nonce)"] --> B[("On-chain state<br/>accumulator · entryCount")]
  B --> C["Indexer GraphQL + WS"]
  C --> D["UI live render<br/>portal · dashboard · analytics"]
  D --> E["2 · DRAW — organizer discloses winning commitment"]
  E --> B
  B --> F["3 · CLAIM — ZK proof:<br/>persistentHash(secret) == winningCommitment"]
  F --> G[("winnerClaimed = true")]
  G --> C
  D --> H["4 · VERIFY — anyone recomputes<br/>the commitment from a ticket"]
  H --> I{"Matches the disclosed<br/>winning commitment?"}
  I -->|yes| J["Win is publicly auditable"]
  I -->|no| K["Honest 'not the winner' result"]
```

- **Enter → state:** each accepted commitment mutates the accumulator and `entryCount`; the indexer streams the change back, so entry counts in the portal, dashboard, and analytics are the chain's own numbers — never a local counter.
- **Draw → enablement:** disclosing the winning commitment moves the contract to `DRAW_PENDING`; the UI enables claim/verify inputs only once the indexer reports it.
- **Claim → closure:** a valid `persistentHash` proof releases the prize and sets `winnerClaimed`, which flows back through the indexer and closes the loop on every screen.
- **Failure feedback:** rejected proofs, closed registration, or a dropped indexer subscription surface as honest Pending→Failed / standby states in the UI — the loop never papers over an error with simulated success.

---

## App Screenshots

### Desktop (1440×900)

| Home — 3D draw-pool hero | Scroll story — pipeline act |
|:---:|:---:|
| ![Desktop home](docs/screenshots/desktop_home.png) | ![Desktop scroll story](docs/screenshots/desktop_story.png) |

| Giveaways | Dashboard |
|:---:|:---:|
| ![Desktop giveaways](docs/screenshots/desktop_giveaways.png) | ![Desktop dashboard](docs/screenshots/desktop_dashboard.png) |

| Winner Verification | Organizer Console |
|:---:|:---:|
| ![Desktop verify](docs/screenshots/desktop_verify.png) | ![Desktop organizer](docs/screenshots/desktop_organizer.png) |

| Analytics | Settings |
|:---:|:---:|
| ![Desktop analytics](docs/screenshots/desktop_analytics.png) | ![Desktop settings](docs/screenshots/desktop_settings.png) |

### Mobile (390×844)

| Home | Dashboard | Giveaways |
|:---:|:---:|:---:|
| ![Mobile home](docs/screenshots/mobile_home.png) | ![Mobile dashboard](docs/screenshots/mobile_dashboard.png) | ![Mobile giveaways](docs/screenshots/mobile_giveaways.png) |

---

## On-Chain Deployment

| Network | Contract Address | Status | Live dApp / Explorer |
|:---|:---|:---|:---|
| **Midnight Preview** | [`0ec3244220040ce3538fd34bb22d6de29a2174bdb7d94b3f52ffc18829ef1fba`](https://veildraw-pgp-ui.vercel.app/giveaways) | **Active & Live** | [Open in VeilDraw Preview dApp](https://veildraw-pgp-ui.vercel.app/giveaways) |
| **Midnight Preview (pre-rewrite)** | `445563f8b0fa114ba33cde6a66f6de928de1f2a7bbe55a89ab4033d0b4dfe4b1` | *Superseded by the rewritten contract above — historical actions at blocks ~511k* | [Query via Indexer GraphQL](https://indexer.preview.midnight.network/api/v4/graphql) |
| **Midnight Preprod** | Standby | *Preprod dust-ledger sync exceeds RAM limits on local hardware; Preview is the primary live testnet.* | [Preview Indexer API](https://indexer.preview.midnight.network/api/v4/graphql) |

### Deployment Details (Preview Testnet)

| Deployment Fact | Value | Verification Link |
|:---|:---|:---|
| **Active Giveaway** | `VeilDraw Preview Giveaway` (5,000 tNIGHT prize) | [View in Live Portal](https://veildraw-pgp-ui.vercel.app/giveaways) |
| **Contract Address** | `0ec3244220040ce3538fd34bb22d6de29a2174bdb7d94b3f52ffc18829ef1fba` | [Open in Preview App](https://veildraw-pgp-ui.vercel.app/giveaways) |
| **Deploy Transaction** | `4dea31dca9a52a5c58e52504c86e8725f742169479810d40d43e7d4a35b5ea9d` | [Query via Indexer GraphQL](https://indexer.preview.midnight.network/api/v4/graphql) |
| **Verified Block** | Block `606,152` (Preview indexer `contractAction`) | [Preview Indexer API](https://indexer.preview.midnight.network/api/v4/graphql) |
| **Create-Giveaway Tx** | `a4fe5727b4277677a167c64b494a1d7577a84551cd0fbf3eb5e6dc4167c58101` (Block `606,157`) | [Query via Indexer GraphQL](https://indexer.preview.midnight.network/api/v4/graphql) |
| **Organizer Wallet** | `mn_addr_preview1lps20dj6gj6fdpnvlz7vj7tlqgdevrnewukkl656d5wl07ft95ksg42xe3` | [Preview Faucet Portal](https://faucet.preview.midnight.network/) |

### Network Infrastructure and Verification Endpoints

| Service | Endpoint URL | Purpose |
|:---|:---|:---|
| **Preview Node RPC** | [`https://rpc.preview.midnight.network`](https://rpc.preview.midnight.network) | Remote RPC node for state & tx submission |
| **Preview Indexer GraphQL** | [`https://indexer.preview.midnight.network/api/v4/graphql`](https://indexer.preview.midnight.network/api/v4/graphql) | Live query interface for on-chain contract state |
| **Preview Indexer WebSocket** | `wss://indexer.preview.midnight.network/api/v4/graphql/ws` | Real-time state subscription stream |
| **Preview Faucet Portal** | [`https://faucet.preview.midnight.network/`](https://faucet.preview.midnight.network/) | Testnet tNIGHT faucet for wallet funding |

---

## App Architecture

```mermaid
flowchart LR
  subgraph Browser["Browser — VeilDraw (Next.js 15 static export)"]
    UI["Views: Home · Dashboard · Giveaways<br/>Verify · Organizer · Analytics · Settings"]
    Store["Zustand store<br/>wallet + contract state"]
    Conn["DApp Connector (CAIP-372)<br/>Lace / 1AM extensions"]
    UI <--> Store
    Conn <--> UI
  end

  subgraph Midnight["Midnight Preview network"]
    Indexer[("Indexer GraphQL + WS<br/>(read-only state)")]
    Node[("RPC node")]
    Contract[["VeilDraw Compact contract<br/>createGiveaway · enterGiveaway<br/>closeAndSelectWinner · claimPrize<br/>cancelGiveaway"]]
    Indexer --- Contract
    Node --- Contract
  end

  subgraph Local["Local machine (write path)"]
    CLI["pgp-cli<br/>deploy / enter / close / claim"]
    Proof["Docker proof server<br/>localhost:6300"]
    CLI --- Proof
  end

  Store -->|subscribe live state| Indexer
  Conn -->|addresses & balances| Browser
  CLI -->|signed txs + ZK proofs| Node
```

**Design notes**

- **Read path (browser):** the UI subscribes to the Preview indexer over GraphQL/WebSocket and renders live contract state — no simulated data anywhere.
- **Write path (CLI):** proving + signing requires the local proof server, so `pgp-cli` submits real transactions (deploy, enter, close, claim) against the RPC node.
- **Wallet connect:** the browser uses the real injected `window.midnight.*` connector (`connect(networkId)` → `getUnshieldedAddress()` / `getShieldedAddresses()` / balances). No fabricated fallback addresses.
- **Single network source:** `pgp-ui/lib/network.ts` derives every label/endpoint from `NEXT_PUBLIC_NETWORK_ID` (`build:preview` / `build:preprod`).

### Repository Structure

```
veildraw/
├── contract/            # Compact ZK contract + 17 Vitest tests
│   ├── src/             #   pgp.compact, witnesses.ts, managed/ (compiled zkir + keys)
│   └── test/pgp.test.ts
├── api/                 # Shared API types & helpers
├── pgp-cli/             # Interactive CLI: deploy / join / enter / close / claim
│   └── src/             #   launchers: preview.ts, preprod.ts, standalone.ts
├── pgp-ui/              # Next.js 15 App Router static dApp
│   ├── app/             #   routes: / /dashboard /giveaways /verify /organizer /analytics /settings
│   ├── components/      #   views, layout, modals (Wallet, Transaction), 3D scene, motion
│   ├── lib/             #   store, network config, scene bridge, types, utils
│   └── utils/           #   midnightWallet (connector), midnightService (indexer)
├── .github/workflows/   # ci.yml — CI/CD pipeline
├── docs/screenshots/    # desktop + mobile captures
├── vercel.json          # CD: auto-deploy to Vercel on main
└── PROPOSAL.md          # product proposal
```

---

## Quick Start

### Prerequisites

- Node.js v24.11.1+
- Docker (proof server)
- Lace or 1AM wallet extension set to **Preview**

### Run the UI

```bash
git clone https://github.com/INdrajit88/veildraw.git
cd veildraw
npm install
npm run dev                      # Next.js dev server
# or production static build for Preview:
npm run preview                  # build:preview + serve ./out
```

### Run the CLI (deploy / interact)

```bash
docker run -d --name pgp-proof-server --rm -p 6300:6300 -e PORT=6300 midnightntwrk/proof-server:8.1.0
cd pgp-cli
npm run preview-remote           # interactive: deploy / join / enter / close / claim
```

### Scripts

| Script | Purpose |
|--------|---------|
| `npm test --workspace=@midnight-ntwrk/pgp-contract` | Contract unit tests (circuit / state / privacy) |
| `npm run build` | Build contract + API + UI workspaces |
| `npm run dev` | Next.js dev server |
| `npm run preview` | Static Preview build + local server |
| `cd pgp-ui && npm run build:preview` | Production static export targeting **Preview** Testnet |
| `cd pgp-ui && npm run build:preprod` | Production static export targeting **Preprod** Testnet |
| `cd pgp-cli && npm run preview-remote` | CLI: deploy / interact with Preview contract |

---

## Sample Preprod Wallets (Generated, Off-Chain)

> ⚠️ **Generated sample data only.** The addresses below are well-formed Midnight **bech32m** addresses (`mn_addr_preprod` HRP, 32-byte payload) produced deterministically for format/input practice in the UI. They were **not** scraped or copied from anywhere, are **not** real users, hold no funds, and have zero on-chain activity — VeilDraw's Preprod deployment is on standby, so no Preprod participants exist yet.

Each payload is `sha256("veildraw-sample-preprod-<n>")`. The generator (`node scripts/gen-sample-wallets.mjs`) confirms the bech32m variant against the live organizer address and re-decodes every address it emits, so each row is checksum-valid and reproducible.

| # | Alias | Sample Preprod address (bech32m, generated) |
|:---|:---|:---|
| 01 | `sample-preprod-01` | `mn_addr_preprod1h64cchtrw50d5jkg8ewlved7s7t55de4md02x0uas3ddgaprahyspz9rcx` |
| 02 | `sample-preprod-02` | `mn_addr_preprod10qcmz7hc43awqhch8qg22zju4j5csjuktyer4uuv5d4vyyks4xmqg8xcpt` |
| 03 | `sample-preprod-03` | `mn_addr_preprod1kkpz4h3p9ydtyha0fx8wkrsma2j92d35za4j6gzfzrnndh7wv2as9t345d` |
| 04 | `sample-preprod-04` | `mn_addr_preprod17kze2y9dhn2pz4jalcrwtmdk6w3qhyyk53qmjfc9thuuap5hzn3q3chcvf` |
| 05 | `sample-preprod-05` | `mn_addr_preprod1szu5cwm63ce30uwtqys7g855rvu2qamwjhrrjzp4zuhk6lutzaxsmypa2q` |
| 06 | `sample-preprod-06` | `mn_addr_preprod100emnwac08scc2v7yp7zhnxp3wvlwvmuljlk9c562cd9egvys2tst7f8vq` |
| 07 | `sample-preprod-07` | `mn_addr_preprod1d3z5vmyh249dqwxwz0vexk9y3ss8rdau0uddn2lpcsanp3qujz6qr888g3` |
| 08 | `sample-preprod-08` | `mn_addr_preprod1a7dmqzkea2edqg24gzwys396m28y7qgnl07z2qeug4rnxc7nu2msnmw70c` |
| 09 | `sample-preprod-09` | `mn_addr_preprod1a28x88wqspy3643rlujqwre3w652529uyeagz9vr5pjvdf42h8fq40t74e` |
| 10 | `sample-preprod-10` | `mn_addr_preprod1zda0n75dtqcakstfr94jsz2xc0jy5vsqrukekrdtgph0v0a58xvqmu5d2y` |
| 11 | `sample-preprod-11` | `mn_addr_preprod133xshx622vw4524lk9gddnc09ze8njju8wnewua3f95e2nlczn8qw4puxu` |
| 12 | `sample-preprod-12` | `mn_addr_preprod1m5sdmunj4kga6elpj45h2fldjdg93w5mdz64tq78uke0m3kd4wmq6h2r66` |
| 13 | `sample-preprod-13` | `mn_addr_preprod1gtuk3sc4ys0km2eqpk2ky7trk22usjfy3ahtatsk2namkecndrasnecqaj` |
| 14 | `sample-preprod-14` | `mn_addr_preprod1746qaqmcqxgdcc0hcu35tmllph7sjc2qymk7e3m8lskv3r6fgutsrqe9um` |
| 15 | `sample-preprod-15` | `mn_addr_preprod104885h3w4vtquffqplgmg45z58a7pje49eafp4lxtxsutn5uzjyqppdsvg` |
| 16 | `sample-preprod-16` | `mn_addr_preprod1a9lzjvh349eljtew6cwfu4se2ex6p5z7v2n7cp40n823dzwh4e6s9r40na` |
| 17 | `sample-preprod-17` | `mn_addr_preprod1sknd64z604r875ew2k2yzmsxlu9kastfgmd8rvs8dapph867502sea56tj` |
| 18 | `sample-preprod-18` | `mn_addr_preprod1yetz2knsn0da0uax7t05snn4ezhdyluzlq53v760zhkunayrtyrqlpsmt9` |
| 19 | `sample-preprod-19` | `mn_addr_preprod1pwpcjpk6qkadkgdezzp8plx7x7ewnleyeszneulln46c09pzps9qgx48tw` |
| 20 | `sample-preprod-20` | `mn_addr_preprod1phuhh5yw2wgmmkhsq0eqmjqwa5q7pmqhsajdzwlu8t3m4xac73wsf6vsf7` |
| 21 | `sample-preprod-21` | `mn_addr_preprod1ly9kxmezlcup853f40qay6x0uthn0vt8qyfxmrnx75jvyg6rg28qt8dy66` |
| 22 | `sample-preprod-22` | `mn_addr_preprod19h89tdpglma0jrqcsvg09rh09v5sxehpl2espyn0zr23gaq3tr7slunq6a` |
| 23 | `sample-preprod-23` | `mn_addr_preprod1unkxw8m9q0rpz6wwg242jplvl0p4t54nwjsukvs4xmsdd8ndeaus9y9ary` |
| 24 | `sample-preprod-24` | `mn_addr_preprod16mmqdn906cv776kfvu72mjrefxhaacf0733754try2u5l9snkk6sj0ghfd` |
| 25 | `sample-preprod-25` | `mn_addr_preprod1wpsn8rvn2n27alya2853pskptwvj056cxp6z7j8rm9kjr6vm639stvcuvx` |
| 26 | `sample-preprod-26` | `mn_addr_preprod1qjk96sl5d29rdv68rwvvppfdm8ellahxhzrmpes26g83cnejtucslvnag8` |
| 27 | `sample-preprod-27` | `mn_addr_preprod1d4vdfmuwdfcm9gg7h2fry0va8phnaks8m5zewml47g60rgytdndszw6c4m` |
| 28 | `sample-preprod-28` | `mn_addr_preprod1k0dsjnjy24vsx2wuuemkvsrl6chlsfj9eegxxrlknjzyvljacw2q6wjhc5` |
| 29 | `sample-preprod-29` | `mn_addr_preprod1mwtku2vyhg8sqguws85l3wmul3w45c64wndwgs6wpyd84zactwgsrlu4ku` |
| 30 | `sample-preprod-30` | `mn_addr_preprod1mmgfptedrzepjjh2l29wy8d9zwhlnw4z0ua3pf6qfmpdm8lyfjusqfr200` |
| 31 | `sample-preprod-31` | `mn_addr_preprod10skkkhyrfv0gjq9eh5mqam89phu252r8a8yyq5j3xt0chsra0gmq8kctn3` |
| 32 | `sample-preprod-32` | `mn_addr_preprod1qdsma2w0ey5kp30jvdj0ap0apwj8xkajh8nprew7cnphjrm2j2wsfq0dxg` |
| 33 | `sample-preprod-33` | `mn_addr_preprod129jewpv325ltxy503amw90zv253779r0uq9jkp6e7705unpw0juq7t9qk5` |
| 34 | `sample-preprod-34` | `mn_addr_preprod1lmt2ug8mz2sunwr0jdj5vn0fmkuhqak7k4tzwqrqgqfzt7vplqrqlthhce` |
| 35 | `sample-preprod-35` | `mn_addr_preprod1k329d40z7fjlu8398jcq98wrmdcwxq79ph8dk23gvl84heujpcesqjkf4g` |
| 36 | `sample-preprod-36` | `mn_addr_preprod18vm20gflxvvuuhvkezyc82t7uk4lxh3jjxpn8vqfqhtgf3txmv2s48u55g` |
| 37 | `sample-preprod-37` | `mn_addr_preprod13mlarpssyumq5gmvxwz4zhhwr6g6n02qc8k420nn9qcyjhhv7rsqu9rvsc` |
| 38 | `sample-preprod-38` | `mn_addr_preprod15rdcttj40u6dn840n3hz445lkwvuvc4ufux0v6tgrwe38pxz5r3q62ch5d` |
| 39 | `sample-preprod-39` | `mn_addr_preprod1jh4n2f2fhw38pq2kruwze6r0mfealar3d4w9svv69mvsuvml68aqkycun2` |
| 40 | `sample-preprod-40` | `mn_addr_preprod1pwsqgdyu8ru4tpcgtuw776a06en030ft83gmcxts84lz2ugrgmcq3249rj` |
| 41 | `sample-preprod-41` | `mn_addr_preprod1u9el2564cpds8smhgskwmn3w00q0ypzff48ujpkq78lezsldttgq72yy22` |
| 42 | `sample-preprod-42` | `mn_addr_preprod1z2hal9uaaemam2pcze9yv3jwldalncx9ytvr7cnnd8s7xf0wvxeq4zpyxj` |
| 43 | `sample-preprod-43` | `mn_addr_preprod1kuv49ydm9ygf7xvpmke27dhcstuysrt6cd02n8ere5jy0fhg2wpsz65puv` |
| 44 | `sample-preprod-44` | `mn_addr_preprod124ckxey4jcxe0vnjg4c95me0966qspsc9vpjavhftmswl6d2qf7s2ch73n` |
| 45 | `sample-preprod-45` | `mn_addr_preprod1nnfz6mewcs77afjtp5q8sn3svftvyzps7fl538tglj50eqn0nh8q6uy3us` |
| 46 | `sample-preprod-46` | `mn_addr_preprod1pz0fj4vvff0q5a2hvfapexzs0q5pl9t8n4xupqushrjaws3rns5sp68353` |
| 47 | `sample-preprod-47` | `mn_addr_preprod1sdt0kn6ktdh2w32nmll6fsxhwga700069c3n6z5mv886vnxmqw8qyzz9ex` |
| 48 | `sample-preprod-48` | `mn_addr_preprod1evwk2zfvkp04u6llcgwnegxkxd76fzzufuu7jqqt99hs3wmxejfql3z9fz` |
| 49 | `sample-preprod-49` | `mn_addr_preprod1wjwy8p8szwfsg3nevchz8gsnwdedt7unf6ulxzyvd3l03cmq74uqzg4ysp` |
| 50 | `sample-preprod-50` | `mn_addr_preprod12f8ne9klttee0yvmq3vwms39sppe206gucqp2xt6lgnux9gf5cfqzl4egz` |

---

## Repository and Links

- **X (Twitter):** [@VeilDraww](https://x.com/VeilDraww)
- **GitHub:** [github.com/INdrajit88/veildraw](https://github.com/INdrajit88/veildraw)
- **Live Demo:** [veildraw-pgp-ui.vercel.app](https://veildraw-pgp-ui.vercel.app/)
- **Demo Video:** [youtu.be/meczmnhMPWo](https://youtu.be/meczmnhMPWo)
- **Program:** [Rise In — New Moon to Full](https://www.risein.com/programs/new-moon-to-full-monthly-moonshots-on-midnight)
- **Feedback Form:** [Google Form](https://forms.gle/HAgcKRcYHsdhM98Z9)
- **Feedback Spreadsheet:** [User Feedback Tracker](https://docs.google.com/spreadsheets/d/12_wo1pkArdF5-j2_LvKGpiHiZExpY--uO0Sw5xErdG8/edit?resourcekey=&gid=37793418#gid=37793418)
- **Support:** [SUPPORT.md](SUPPORT.md) • **Proposal:** [PROPOSAL.md](PROPOSAL.md)

**License:** MIT
