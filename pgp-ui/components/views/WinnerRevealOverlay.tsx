'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, EyeOff, KeyRound, Radio, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrambleText } from '@/components/motion/ScrambleText';
import { formatAddress, truncateHex } from '@/lib/utils';
import { networkCapitalized } from '@/lib/network';
import { ease } from '@/lib/motion';
import type { GiveawayItem, WalletState } from '@/lib/types';

type RevealFieldComponent = React.ComponentType<{ count: number }>;

/**
 * Fetched with a runtime `import()` on first open rather than `next/dynamic`,
 * which would register the three.js chunk in this route's initial script list
 * and undo the deferral the page relies on. Costs nothing until the overlay is
 * actually opened.
 */

interface WinnerRevealOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  giveaway: GiveawayItem;
  wallet: WalletState;
  indexerConnected: boolean;
  /** Scales the bloom field; pass a tier-appropriate count. */
  particles?: number;
}

/** Staggered verdict sequence, timed to land as the bloom finishes expanding. */
const sequence = {
  hidden: {},
  show: { transition: { delayChildren: 1.25, staggerChildren: 0.42 } },
};

const line = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

/**
 * Full-screen winner reveal.
 *
 * Deliberately shows no winner wallet address: the protocol never publishes one,
 * so inventing one here would misrepresent the product. What is real is shown —
 * the posted winning commitment, and the viewer's own address when connected,
 * which is the only identity in this flow that anyone can see.
 */
export function WinnerRevealOverlay({
  open,
  onOpenChange,
  giveaway,
  wallet,
  indexerConnected,
  particles = 900,
}: WinnerRevealOverlayProps) {
  const reduceMotion = useReducedMotion();
  const [RevealField, setRevealField] = useState<RevealFieldComponent | null>(null);
  const liveCommitment = indexerConnected && giveaway.winningCommitment.length > 0 ? giveaway.winningCommitment : null;

  // Load the bloom field the first time the overlay is opened, and only then.
  useEffect(() => {
    if (!open || reduceMotion || RevealField) return;
    let cancelled = false;
    void import('@/components/3d/WinnerReveal')
      .then((module) => {
        if (!cancelled) setRevealField(() => module.WinnerReveal);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, reduceMotion, RevealField]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose={false}
        className="h-[100svh] max-h-none w-screen max-w-none overflow-hidden rounded-none border-0 bg-void p-0 shadow-none data-[state=open]:zoom-in-100 data-[state=open]:animate-in"
      >
        <DialogTitle className="sr-only">Winner reveal — proof verified, identity concealed</DialogTitle>

        {/* The bloom: one point expanding into a field. */}
        <div className="absolute inset-0" aria-hidden>
          <AnimatePresence>
            {open && !reduceMotion && RevealField ? <RevealField count={particles} /> : null}
          </AnimatePresence>
          {reduceMotion && <div className="veil-volumetric absolute inset-0" />}
        </div>

        {/* Legibility scrim so the verdict always clears the field. */}
        <div className="absolute inset-0 bg-gradient-to-b from-void/70 via-transparent to-void/90" aria-hidden />

        <motion.div
          variants={reduceMotion ? undefined : sequence}
          initial={reduceMotion ? false : 'hidden'}
          animate="show"
          className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-6 overflow-y-auto px-6 py-24 text-center"
        >
          <motion.div variants={reduceMotion ? undefined : line} className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full border border-emerald/30 bg-emerald-soft">
              <ShieldCheck className="size-4 text-emerald" aria-hidden />
            </span>
            <ScrambleText
              as="p"
              text="PROOF VERIFIED"
              speed={28}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald"
            />
          </motion.div>

          <motion.h2
            variants={reduceMotion ? undefined : line}
            className="font-display text-[clamp(52px,13vw,148px)] font-semibold leading-[0.9] tracking-[-0.05em] text-white"
          >
            WINNER
          </motion.h2>

          <motion.p
            variants={reduceMotion ? undefined : line}
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-ink-muted-80"
          >
            <EyeOff className="size-3.5 text-violet" aria-hidden />
            Private participant
          </motion.p>

          <motion.div variants={reduceMotion ? undefined : line} className="w-full max-w-lg">
            <div className="veil-glass-strong rounded-lg p-5 text-left">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted-48">
                  <KeyRound className="size-3" aria-hidden />
                  Winning commitment
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted-48/70">
                  {liveCommitment ? 'Live' : 'Standby'}
                </span>
              </div>

              {liveCommitment ? (
                <p className="tnum mt-3 break-all font-mono text-sm text-violet" title={liveCommitment}>
                  {truncateHex(liveCommitment, 18, 14)}
                </p>
              ) : (
                <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-muted-80">
                  <Radio className="mt-0.5 size-3.5 shrink-0 text-amber" aria-hidden />
                  <span>
                    No winning commitment is posted on {networkCapitalized} yet. Connect a deployed contract address in
                    Settings to stream the real value.
                  </span>
                </p>
              )}

              <p className="mt-4 border-t border-white/[0.06] pt-3 text-xs leading-relaxed text-ink-muted-48">
                The commitment is public. The wallet behind it is not — not to the organizer, not to the chain. Only the
                device holding the matching ticket secret can prove ownership.
              </p>
            </div>
          </motion.div>

          {/* The only real identity in this flow: the viewer's own, seen only here. */}
          <motion.div variants={reduceMotion ? undefined : line} className="w-full max-w-lg">
            {wallet.isConnected && wallet.address ? (
              <div className="veil-glass flex flex-wrap items-center justify-between gap-3 rounded-lg px-5 py-4">
                <div className="text-left">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted-48">
                    Private identity · visible only to you
                  </p>
                  <p className="tnum mt-1.5 break-all font-mono text-xs text-white">{formatAddress(wallet.address)}</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-pill border border-emerald/25 bg-emerald-soft px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald">
                  <span className="size-1.5 rounded-full bg-emerald" aria-hidden />
                  Connected
                </span>
              </div>
            ) : (
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted-48">
                No wallet connected — nothing about you is in this draw
              </p>
            )}
          </motion.div>

          <motion.div variants={reduceMotion ? undefined : line} className="mt-2 flex flex-wrap justify-center gap-3.5">
            <Link href="/verify">
              <Button variant="hero" className="gap-2.5">
                <span>Claim reward</span>
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </Link>
            <Button variant="heroSecondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
