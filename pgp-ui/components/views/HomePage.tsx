'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ShieldCheck,
  KeyRound,
  EyeOff,
  Shuffle,
  Trophy,
  ArrowRight,
  Lock,
  Layers,
  Check,
  ChevronRight,
  Cpu,
  Hash,
  ScanSearch,
  Fingerprint,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WinnerRevealJourney } from '@/components/views/WinnerRevealJourney';
import { LiveGiveawayCard } from '@/components/views/LiveGiveawayCard';
import { staggerContainer, staggerItem, fadeSlideUp, ease } from '@/lib/motion';
import type { GiveawayItem, WalletState } from '@/lib/types';
import { networkCapitalized, indexerUrl } from '@/lib/network';

// Heavy 3D bundle — lazy-loaded, client-only
const VeilVaultCanvas = dynamic(() => import('@/components/3d/VeilVaultCanvas').then((m) => m.VeilVaultCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="size-8 animate-spin rounded-full border-2 border-primary/60 border-t-transparent"
        role="status"
        aria-label="Loading scene"
      />
    </div>
  ),
});

interface HomePageProps {
  giveaway: GiveawayItem;
  wallet: WalletState;
  onOpenWalletModal: () => void;
  indexerConnected?: boolean;
}

const steps = [
  {
    n: '01',
    title: 'Create',
    body: 'The organizer initializes the giveaway in a Compact ZK contract. Prize terms and the organizer’s public key are bound on-chain.',
    icon: KeyRound,
  },
  {
    n: '02',
    title: 'Enter',
    body: 'Participants derive a ticket secret locally and publish only a 32-byte commitment. No address, no name, no entry list.',
    icon: EyeOff,
  },
  {
    n: '03',
    title: 'Draw',
    body: 'The organizer closes entries and posts one winning commitment. The accumulator freezes — nothing else is revealed.',
    icon: Shuffle,
  },
  {
    n: '04',
    title: 'Claim',
    body: 'The winner proves ticket ownership in zero knowledge and claims the prize. The chain never learns who won.',
    icon: Trophy,
  },
];

const privateItems = [
  { title: 'Participant secret keys', desc: 'Derived and held locally — never transmitted.' },
  { title: 'Ticket secrets & nonces', desc: 'The winning ticket is proven, never revealed.' },
  { title: 'Losing entries', desc: 'Unselected commitments stay hidden; no participant list exists.' },
  { title: 'Identity & wallet linkage', desc: 'Commitments are opaque — no address in the accumulator.' },
];

const publicItems = [
  { title: 'Entry accumulator root', desc: 'Order-bound cryptographic hash, updated per entry.' },
  { title: 'Entry counter', desc: 'Verifiable on-chain count of registered commitments.' },
  { title: 'Winning commitment', desc: 'The single drawn commitment posted by the organizer.' },
  { title: 'Claim status', desc: 'Boolean ledger flag confirming the prize was claimed.' },
];

const whyMidnight = [
  {
    icon: ScanSearch,
    title: 'Fully verifiable',
    body: `Every state transition is observable through the ${networkCapitalized} indexer GraphQL.`,
  },
  {
    icon: Fingerprint,
    title: 'Zero-knowledge settlement',
    body: 'Winner eligibility is proven inside the circuit — not by identity, not by reputation.',
  },
  {
    icon: Zap,
    title: 'Built for frequent draws',
    body: 'Midnight is designed for low-fee, high-throughput settlement.',
  },
  {
    icon: ShieldCheck,
    title: 'Leak-proof by design',
    body: 'Compact’s disclose() discipline rejects accidental secret leakage at compile time.',
  },
];

export function HomePage({ giveaway, wallet, onOpenWalletModal, indexerConnected = false }: HomePageProps) {
  const reduceMotion = useReducedMotion();

  const heroVariants = reduceMotion ? undefined : staggerContainer;
  const itemVariants = reduceMotion ? undefined : staggerItem;

  return (
    <div className="relative min-h-screen bg-canvas text-body">
      {/* ── 01 · HERO ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-[92vh] items-center px-6 pt-10 pb-16">
        <div className="ambient pointer-events-none absolute inset-0" aria-hidden />
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative mx-auto grid w-full max-w-grid grid-cols-1 items-center gap-14 lg:grid-cols-12">
          {/* Left — copy */}
          <motion.div
            variants={heroVariants}
            initial={reduceMotion ? false : 'initial'}
            animate="animate"
            className="z-10 space-y-7 text-center lg:col-span-6 lg:text-left"
          >
            <motion.div variants={itemVariants} className="flex justify-center lg:justify-start">
              <span className="inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/[0.03] px-3.5 py-1.5">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted-80">
                  {networkCapitalized} · Zero-knowledge giveaways
                </span>
              </span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="t-hero">
              Private giveaways.
              <br />
              <span className="text-primary-bright">Public proof.</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="t-lead mx-auto max-w-xl lg:mx-0">
              VeilDraw runs zero-knowledge giveaways on Midnight. Entries are opaque commitments — no participant lists,
              no exposed addresses — and winners claim prizes by proving their ticket, not their identity.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center justify-center gap-3.5 pt-1 lg:justify-start"
            >
              {wallet.isConnected ? (
                <Link href="/giveaways">
                  <Button variant="hero" className="gap-2">
                    <span>Enter a giveaway</span>
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                </Link>
              ) : (
                <Button variant="hero" onClick={onOpenWalletModal} className="gap-2">
                  <span>Connect wallet to start</span>
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              )}
              <Link href="/organizer">
                <Button variant="heroSecondary">Launch a giveaway</Button>
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted-48 lg:justify-start"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" aria-hidden /> Zero entry lists published
              </span>
              <span className="flex items-center gap-1.5">
                <Hash className="size-3.5 text-primary" aria-hidden /> 32-byte commitments only
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu className="size-3.5 text-primary" aria-hidden /> Compact ZK circuits
              </span>
            </motion.div>
          </motion.div>

          {/* Right — 3D ecosystem */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease }}
            className="relative mx-auto w-full max-w-[560px] lg:col-span-6"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b0e16]/70 shadow-raised">
              <VeilVaultCanvas />

              {/* Floating status chips — large screens only */}
              <div className="float-slow absolute left-4 top-4 z-10 hidden items-center gap-2 rounded-pill border border-white/[0.08] bg-black/60 px-3 py-1.5 backdrop-blur-md lg:flex">
                <ShieldCheck className="size-3.5 text-primary-bright" aria-hidden />
                <span className="font-mono text-[11px] text-ink-muted-80">ZK proof verified</span>
              </div>
              <div className="float-slower absolute bottom-5 right-4 z-10 hidden items-center gap-2 rounded-pill border border-white/[0.08] bg-black/60 px-3 py-1.5 backdrop-blur-md lg:flex">
                <EyeOff className="size-3.5 text-violet" aria-hidden />
                <span className="font-mono text-[11px] text-ink-muted-80">Entries stay private</span>
              </div>
            </div>
            <p className="mt-3 text-center font-mono text-[11px] text-ink-muted-48">
              The sealed vault — private entry commitments orbiting a single provable draw
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── 02 · HOW IT WORKS ─────────────────────────────────────── */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-grid">
          <motion.div
            variants={reduceMotion ? undefined : fadeSlideUp}
            initial={reduceMotion ? false : 'initial'}
            whileInView="animate"
            viewport={{ once: true, margin: '-80px' }}
            className="mx-auto max-w-2xl space-y-4 text-center"
          >
            <span className="eyebrow justify-center">The process</span>
            <h2 className="t-display-lg">Four steps. Absolute privacy.</h2>
            <p className="t-body mx-auto max-w-xl">
              From contract initialization to zero-knowledge claim — how VeilDraw keeps every participant hidden while
              the result stays provable.
            </p>
          </motion.div>

          <ol className="relative mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Connecting line — desktop */}
            <div
              className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent lg:block"
              aria-hidden
            />
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.li
                  key={s.n}
                  variants={reduceMotion ? undefined : staggerItem}
                  initial={reduceMotion ? false : 'initial'}
                  whileInView="animate"
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: i * 0.08, ease }}
                  className="veil-card veil-card-hover relative rounded-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-md border border-primary/25 bg-primary-soft text-primary-bright">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="font-mono text-2xl font-semibold text-white/15">{s.n}</span>
                  </div>
                  <h3 className="mt-5 t-tagline text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted-80">{s.body}</p>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ── 03 · PRIVATE BY DESIGN ────────────────────────────────── */}
      <section className="border-y border-white/[0.05] bg-parchment px-6 py-24">
        <div className="mx-auto max-w-grid">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <motion.div
              variants={reduceMotion ? undefined : fadeSlideUp}
              initial={reduceMotion ? false : 'initial'}
              whileInView="animate"
              viewport={{ once: true, margin: '-80px' }}
              className="space-y-4 lg:col-span-5"
            >
              <span className="eyebrow">Privacy architecture</span>
              <h2 className="t-display-lg">Not every giveaway needs an audience.</h2>
              <p className="t-body leading-relaxed">
                Traditional giveaway tools leak entry lists, emails, and wallet links. VeilDraw splits the protocol in
                two: what your device keeps, and what the ledger publishes.
              </p>
              <div className="pt-3">
                <Link href="/organizer">
                  <Button variant="secondary" className="gap-2">
                    <span>Open the organizer console</span>
                    <ChevronRight className="size-4" aria-hidden />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-7">
              <motion.div
                variants={reduceMotion ? undefined : fadeSlideUp}
                initial={reduceMotion ? false : 'initial'}
                whileInView="animate"
                viewport={{ once: true, margin: '-60px' }}
                className="rounded-lg border border-primary/20 bg-[#0b0e16] p-6"
              >
                <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 font-mono text-xs font-medium uppercase tracking-wider text-primary-bright">
                  <Lock className="size-3.5" aria-hidden />
                  Stays on your device
                </div>
                <ul className="mt-4 space-y-3.5">
                  {privateItems.map((item) => (
                    <li key={item.title}>
                      <p className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Check className="size-3.5 shrink-0 text-primary" aria-hidden />
                        {item.title}
                      </p>
                      <p className="pl-6 text-xs leading-relaxed text-ink-muted-48">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                variants={reduceMotion ? undefined : fadeSlideUp}
                initial={reduceMotion ? false : 'initial'}
                whileInView="animate"
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: reduceMotion ? 0 : 0.08 }}
                className="rounded-lg border border-white/[0.08] bg-[#0b0e16] p-6"
              >
                <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 font-mono text-xs font-medium uppercase tracking-wider text-ink-muted-80">
                  <Layers className="size-3.5 text-violet" aria-hidden />
                  Published on-chain
                </div>
                <ul className="mt-4 space-y-3.5">
                  {publicItems.map((item) => (
                    <li key={item.title}>
                      <p className="flex items-center gap-2 text-sm font-semibold text-white">
                        <span className="size-1.5 shrink-0 rounded-full bg-violet" aria-hidden />
                        {item.title}
                      </p>
                      <p className="pl-3.5 text-xs leading-relaxed text-ink-muted-48">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 04 · LIVE GIVEAWAY (real on-chain data) ───────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-content space-y-10">
          <motion.div
            variants={reduceMotion ? undefined : fadeSlideUp}
            initial={reduceMotion ? false : 'initial'}
            whileInView="animate"
            viewport={{ once: true, margin: '-80px' }}
            className="space-y-3 text-center"
          >
            <span className="eyebrow justify-center">Live on-chain state</span>
            <h2 className="t-display-lg">Current giveaway</h2>
            <p className="t-body mx-auto max-w-xl">
              Real-time contract state, streamed from the {networkCapitalized} Midnight indexer — no simulated data.
            </p>
          </motion.div>

          <LiveGiveawayCard
            giveaway={giveaway}
            indexerConnected={indexerConnected}
            wallet={wallet}
            onOpenWalletModal={onOpenWalletModal}
          />
        </div>
      </section>

      {/* ── 05 · WHY MIDNIGHT ─────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-grid">
          <motion.div
            variants={reduceMotion ? undefined : fadeSlideUp}
            initial={reduceMotion ? false : 'initial'}
            whileInView="animate"
            viewport={{ once: true, margin: '-80px' }}
            className="max-w-2xl space-y-4"
          >
            <span className="eyebrow">Why Midnight</span>
            <h2 className="t-display-lg">A network built for provable privacy.</h2>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
            {whyMidnight.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={reduceMotion ? undefined : staggerItem}
                  initial={reduceMotion ? false : 'initial'}
                  whileInView="animate"
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.4, delay: reduceMotion ? 0 : i * 0.06, ease }}
                  className="space-y-3 bg-[#0d1017] p-6"
                >
                  <span className="flex size-9 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-primary-bright">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                  <p className="text-xs leading-relaxed text-ink-muted-48">{f.body}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <a
              href={indexerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted-48 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              <span>Verify contract state in the {networkCapitalized} indexer</span>
              <ChevronRight className="size-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </section>

      {/* ── 06 · WINNER REVEAL JOURNEY ────────────────────────────── */}
      <section className="border-t border-white/[0.05] bg-parchment px-6 py-24">
        <div className="mx-auto max-w-grid space-y-12">
          <motion.div
            variants={reduceMotion ? undefined : fadeSlideUp}
            initial={reduceMotion ? false : 'initial'}
            whileInView="animate"
            viewport={{ once: true, margin: '-80px' }}
            className="mx-auto max-w-2xl space-y-4 text-center"
          >
            <span className="eyebrow justify-center">Fair draw experience</span>
            <h2 className="t-display-lg">One draw. One result. No drama.</h2>
            <p className="t-body mx-auto max-w-xl">Walk the journey from private entry to anonymous claim.</p>
          </motion.div>

          <WinnerRevealJourney giveaway={giveaway} connected={indexerConnected} />
        </div>
      </section>

      {/* ── 07 · CLOSING CTA ──────────────────────────────────────── */}
      <section className="px-6 py-28">
        <div className="ambient relative mx-auto max-w-content overflow-hidden rounded-xl border border-white/[0.07] bg-[#0e1118] px-8 py-16 text-center md:py-20">
          <motion.div
            variants={reduceMotion ? undefined : fadeSlideUp}
            initial={reduceMotion ? false : 'initial'}
            whileInView="animate"
            viewport={{ once: true, margin: '-80px' }}
            className="space-y-5"
          >
            <h2 className="t-display-lg mx-auto max-w-2xl">
              Ready to run a giveaway the chain can verify — but can’t see through?
            </h2>
            <p className="t-body mx-auto max-w-xl">
              Your entry is a hash. Your win is a proof. Your identity stays yours.
            </p>
          </motion.div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            {wallet.isConnected ? (
              <Link href="/giveaways">
                <Button variant="hero" className="gap-2">
                  <span>Enter a giveaway</span>
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              </Link>
            ) : (
              <Button variant="hero" onClick={onOpenWalletModal} className="gap-2">
                <span>Connect wallet to start</span>
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            )}
            <Link href="/organizer">
              <Button variant="heroSecondary">Launch a giveaway</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
