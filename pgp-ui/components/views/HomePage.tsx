'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ShieldCheck, Fingerprint, LockKeyhole, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WalletState } from '@/lib/types';

interface HomePageProps {
  giveaway: unknown;
  wallet: WalletState;
  onOpenWalletModal: () => void;
}

// Imagery sourced from Unsplash (verified live)
const IMG = {
  hero: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1600&auto=format&fit=crop',
  privacy: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop',
  fairness: 'https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?q=80&w=1600&auto=format&fit=crop',
};

const steps = [
  {
    n: '01',
    title: 'Create & Escrow',
    body: 'Organizer calls createGiveaway(). The contract binds organizerPk via ZK witness and locks the prize escrow.',
  },
  {
    n: '02',
    title: 'Generate ZK Commitment',
    body: 'Client computes persistentHash([secret, sk, nonce]) locally. Only the opaque hash is appended to the on-chain accumulator.',
  },
  {
    n: '03',
    title: 'Draw & Publish',
    body: 'Organizer closes registration and posts the winning commitment. No participant identity is ever revealed.',
  },
  {
    n: '04',
    title: 'Prove & Claim',
    body: 'The winner proves ticket ownership in zero knowledge with claimPrize(). The prize releases without an address link.',
  },
];

const privateItems = [
  'Participant secret key (localSecretKey)',
  'Random ticket secret & nonce',
  'Unselected tickets and losing entries',
  'Merkle accumulator paths & witnesses',
  'Off-chain LevelDB key store',
];

const marqueeItems = [
  'Zero-Knowledge Proofs',
  'Private Entries',
  'Escrowed Prizes',
  'On-Chain Accumulator',
  'Anonymous Claims',
  '5 ZK Circuits',
];

export function HomePage({ wallet, onOpenWalletModal }: HomePageProps) {
  return (
    <div>
      {/* ── hero tile ─────────────────────────────────────────────────── */}
      <section className="bg-canvas">
        <div className="mx-auto flex max-w-content flex-col items-center px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <h1 className="t-hero max-w-3xl text-ink">
              Private giveaways.
              <br />
              Cryptographically proven.
            </h1>
            <p className="t-lead mt-5 max-w-2xl text-ink-muted-80">
              Enter giveaways, register ZK commitments, and prove winning tickets on-chain — without ever exposing your
              wallet address or identity.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {wallet.isConnected ? (
                <Link href="/giveaways">
                  <Button variant="hero">Enter a Giveaway</Button>
                </Link>
              ) : (
                <Button variant="hero" onClick={onOpenWalletModal}>
                  Connect Wallet to Start
                </Button>
              )}
              <Link href="/dashboard">
                <Button variant="secondary">Explore Dashboard</Button>
              </Link>
            </div>
            <p className="t-fine-print mt-6 text-ink-muted-48">
              Wallet required for giveaway participation and ZK proof generation.
            </p>
          </motion.div>

          {/* animated hero visual — ken burns image + floating chips */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative mt-16 w-full max-w-3xl"
          >
            <div className="product-shadow overflow-hidden rounded-lg">
              <img
                src={IMG.hero}
                alt="Abstract cryptographic network render"
                className="kenburns aspect-[16/9] w-full object-cover"
              />
            </div>
            <div className="float-slow absolute -left-4 top-8 hidden items-center gap-2 rounded-pill bg-canvas/90 px-4 py-2 shadow-sm backdrop-blur md:flex">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="t-button-utility text-ink">ZK proof verified</span>
            </div>
            <div className="float-slower absolute -right-4 top-1/3 hidden items-center gap-2 rounded-pill bg-canvas/90 px-4 py-2 shadow-sm backdrop-blur md:flex">
              <Fingerprint className="h-4 w-4 text-primary" />
              <span className="t-button-utility text-ink">0 addresses exposed</span>
            </div>
            <div className="float-slow absolute -bottom-4 left-1/3 hidden items-center gap-2 rounded-pill bg-canvas/90 px-4 py-2 shadow-sm backdrop-blur md:flex">
              <LockKeyhole className="h-4 w-4 text-primary" />
              <span className="t-button-utility text-ink">Commitment registered</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── marquee strip ─────────────────────────────────────────────── */}
      <section className="overflow-hidden bg-surface-black py-4">
        <div className="marquee-track flex w-max items-center gap-10">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="flex items-center gap-10">
              <span className="t-button-utility whitespace-nowrap text-white/80">{item}</span>
              <Sparkles className="h-3.5 w-3.5 text-primary-on-dark" />
            </span>
          ))}
        </div>
      </section>

      {/* ── product-tile-dark: how it works ──────────────────────────── */}
      <section className="bg-tile-1">
        <div className="mx-auto max-w-grid px-6 py-20">
          <h2 className="t-display-lg text-center text-white">How VeilDraw works</h2>
          <p className="t-lead mt-4 text-center text-body-muted">
            From organizer deployment to ZK prize verification — the full cryptographic flow.
          </p>

          <div className="mt-16 grid grid-cols-1 gap-x-12 gap-y-14 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="t-lead-airy text-primary-on-dark">{s.n}</p>
                <h3 className="t-tagline mt-3 text-white">{s.title}</h3>
                <p className="t-caption mt-3 leading-relaxed text-body-muted">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── split tile: private by design ─────────────────────────────── */}
      <section className="bg-parchment">
        <div className="mx-auto grid max-w-grid items-center gap-12 px-6 py-20 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="group overflow-hidden rounded-lg"
          >
            <img
              src={IMG.privacy}
              alt="Abstract 3D privacy render"
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="t-display-lg text-ink">Private by design.</h2>
            <p className="t-lead mt-4 text-ink-muted-80">
              Your entry is a hash. Your ticket is a secret. The ledger only ever sees opaque commitments.
            </p>
            <p className="t-body mt-4 leading-relaxed text-ink-muted-48">
              Commitments are computed locally and appended to an on-chain accumulator. Nothing you hold is ever
              transmitted — only proof of it.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── what stays private ────────────────────────────────────────── */}
      <section className="bg-canvas">
        <div className="mx-auto max-w-content px-6 py-20">
          <h2 className="t-display-lg text-center text-ink">What stays private</h2>
          <p className="t-lead mt-4 text-center text-ink-muted-80">
            The ledger sees commitments. Only you hold the secrets.
          </p>

          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-x-16 gap-y-4 md:grid-cols-2">
            {privateItems.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <span className="t-body text-ink-muted-80">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── split dark tile: provable fairness ────────────────────────── */}
      <section className="bg-tile-2">
        <div className="mx-auto grid max-w-grid items-center gap-12 px-6 py-20 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="order-2 md:order-1"
          >
            <h2 className="t-display-lg text-white">Provable fairness.</h2>
            <p className="t-lead mt-4 text-body-muted">
              The winning commitment is published on-chain. Anyone can audit the draw — nobody can link it.
            </p>
            <div className="mt-8 flex flex-wrap gap-6">
              <Link href="/verify" className="t-body text-primary-on-dark hover:underline">
                Verify a winning ticket
              </Link>
              <Link href="/analytics" className="t-body text-primary-on-dark hover:underline">
                View protocol analytics
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="order-1 overflow-hidden rounded-lg md:order-2"
          >
            <img
              src={IMG.fairness}
              alt="Dark abstract 3D geometry"
              loading="lazy"
              className="kenburns aspect-[4/3] w-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* ── closing CTA ───────────────────────────────────────────────── */}
      <section className="bg-parchment">
        <div className="mx-auto max-w-content px-6 py-20 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="t-lead-airy text-ink"
          >
            “Your entry is a hash, your win is a proof, your prize is yours.”
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8"
          >
            {wallet.isConnected ? (
              <Link href="/giveaways">
                <Button variant="hero">Enter a Giveaway</Button>
              </Link>
            ) : (
              <Button variant="hero" onClick={onOpenWalletModal}>
                Connect Wallet to Start
              </Button>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
