'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Fingerprint, ScanSearch, ShieldCheck, Zap } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/motion/Magnetic';
import { RevealText, SectionReveal } from '@/components/motion/RevealText';
import { WinnerRevealJourney } from '@/components/views/WinnerRevealJourney';
import { fadeSlideUp, staggerItem, ease } from '@/lib/motion';
import { indexerUrl, networkCapitalized } from '@/lib/network';
import type { GiveawayItem, WalletState } from '@/lib/types';

interface ClosingSectionsProps {
  wallet: WalletState;
  giveaway: GiveawayItem;
  indexerConnected: boolean;
  onOpenWalletModal: () => void;
}

const WHY_MIDNIGHT = [
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
] as const;

/**
 * Tail of the page: sits outside the scroll-story container with an opaque
 * background, so the fixed canvas stays parked on the vault while this reads as
 * a normal page section.
 */
export function ClosingSections({ wallet, giveaway, indexerConnected, onOpenWalletModal }: ClosingSectionsProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative z-10">
      {/* Blend from the void into the standard canvas */}
      <div className="h-28 bg-gradient-to-b from-void to-canvas" aria-hidden />

      <div className="bg-canvas">
        {/* ── THE REVEAL FLOW ──────────────────────────────────────── */}
        <section className="px-6 pt-4 pb-24" aria-labelledby="reveal-flow-heading">
          <div className="mx-auto max-w-grid space-y-12">
            <SectionReveal className="mx-auto max-w-2xl space-y-4 text-center">
              <span className="eyebrow justify-center">Fair draw experience</span>
              <RevealText
                as="h2"
                id="reveal-flow-heading"
                text="One draw. One result. No drama."
                className="t-display-lg"
              />
              <p className="t-body mx-auto max-w-xl">Walk the journey from private entry to anonymous claim.</p>
            </SectionReveal>

            <WinnerRevealJourney giveaway={giveaway} connected={indexerConnected} />
          </div>
        </section>

        {/* ── WHY MIDNIGHT ─────────────────────────────────────────── */}
        <section className="px-6 pb-24" aria-labelledby="why-heading">
          <div className="mx-auto max-w-grid">
            <SectionReveal className="max-w-2xl space-y-4">
              <span className="eyebrow">Why Midnight</span>
              <RevealText
                as="h2"
                id="why-heading"
                text="A network built for provable privacy."
                className="t-display-lg"
              />
            </SectionReveal>

            <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
              {WHY_MIDNIGHT.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    variants={reduceMotion ? undefined : staggerItem}
                    initial={reduceMotion ? false : 'initial'}
                    whileInView="animate"
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.06, ease }}
                    className="space-y-3 bg-[#0d1017] p-6"
                  >
                    <span className="flex size-9 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-primary-bright">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                    <p className="text-xs leading-relaxed text-ink-muted-48">{feature.body}</p>
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

        {/* ── CLOSING CTA ──────────────────────────────────────────── */}
        <section className="px-6 pb-28" aria-labelledby="closing-heading">
          <motion.div
            variants={reduceMotion ? undefined : fadeSlideUp}
            initial={reduceMotion ? false : 'initial'}
            whileInView="animate"
            viewport={{ once: true, margin: '-80px' }}
            className="ambient relative mx-auto max-w-content overflow-hidden rounded-xl border border-white/[0.07] bg-[#0e1118] px-8 py-16 text-center md:py-20"
          >
            <div className="space-y-5">
              <RevealText
                as="h2"
                id="closing-heading"
                lines={['Ready to run a giveaway the chain', 'can verify — but can’t see through?']}
                className="t-display-lg mx-auto max-w-2xl"
              />
              <p className="t-body mx-auto max-w-xl">
                Your entry is a hash. Your win is a proof. Your identity stays yours.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Magnetic strength={0.18}>
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
              </Magnetic>
              <Link href="/organizer">
                <Button variant="heroSecondary">Launch a giveaway</Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
