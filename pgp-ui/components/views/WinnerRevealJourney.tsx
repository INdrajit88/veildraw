'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { LucideIcon, Lock, Shuffle, KeyRound, Trophy, EyeOff, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GiveawayItem } from '@/lib/types';

interface RevealStep {
  id: string;
  stage: string;
  title: string;
  description: string;
  circuit: string;
  icon: LucideIcon;
}

const REVEAL_STEPS: RevealStep[] = [
  {
    id: 'entries',
    stage: '01 / 05',
    title: 'Private entries',
    description:
      'Participants generate ticket secrets locally. Only opaque 32-byte commitments are chained into the on-chain accumulator — no names, emails, or wallet addresses exist on-chain.',
    circuit: 'enterGiveaway()',
    icon: EyeOff,
  },
  {
    id: 'lock',
    stage: '02 / 05',
    title: 'Registration lock',
    description:
      'The organizer closes entries via closeAndSelectWinner(). The accumulator freezes and no further entries can be appended.',
    circuit: 'closeAndSelectWinner()',
    icon: Lock,
  },
  {
    id: 'draw',
    stage: '03 / 05',
    title: 'Cryptographic draw',
    description:
      'The drawn winning commitment is published to contract state. Once posted on-chain, the disclosed commitment is immutable.',
    circuit: 'winningCommitment',
    icon: Shuffle,
  },
  {
    id: 'suspense',
    stage: '04 / 05',
    title: 'Zero-knowledge suspense',
    description:
      'The winning commitment is visible to everyone, but the ticket holder behind it remains unknown — to the chain, to the organizer, and to other participants.',
    circuit: 'persistentHash check',
    icon: KeyRound,
  },
  {
    id: 'reveal',
    stage: '05 / 05',
    title: 'Anonymous claim',
    description:
      'The winner submits a private witness to claimPrize(). The ZK proof verifies ticket ownership without ever revealing the winner’s identity.',
    circuit: 'claimPrize()',
    icon: Trophy,
  },
];

interface WinnerRevealJourneyProps {
  /** When provided and connected, live on-chain values replace the examples. */
  giveaway?: GiveawayItem;
  connected?: boolean;
}

export function WinnerRevealJourney({ giveaway, connected = false }: WinnerRevealJourneyProps) {
  const [activeStep, setActiveStep] = useState(0);
  const reduceMotion = useReducedMotion();

  const current = REVEAL_STEPS[activeStep];
  const Icon = current.icon;

  const liveAccumulator =
    connected && giveaway && giveaway.entryAccumulator.length > 0 ? giveaway.entryAccumulator : null;
  const liveCommitment = connected && giveaway && giveaway.state === 'DRAW_PENDING' ? giveaway.winningCommitment : null;

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0e1118]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-5 md:px-8">
        <div>
          <div className="eyebrow">
            <Sparkles className="size-3.5" aria-hidden />
            <span>The reveal flow</span>
          </div>
          <h3 className="mt-2 t-tagline text-white">How the veil is lifted</h3>
        </div>

        {/* Step pills */}
        <div
          role="tablist"
          aria-label="Reveal stages"
          className="flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.02] p-1"
        >
          {REVEAL_STEPS.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={activeStep === i}
              onClick={() => setActiveStep(i)}
              className={`press rounded-[6px] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors duration-200 sm:px-3 ${
                activeStep === i ? 'bg-primary text-white' : 'text-ink-muted-48 hover:text-white'
              }`}
            >
              {s.id}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-8 px-6 py-8 md:px-8 lg:grid-cols-2 lg:items-center">
        {/* Left: step copy */}
        <div className="space-y-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-medium text-primary-bright">{current.stage}</span>
                <span className="rounded-pill border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted-80">
                  {current.circuit}
                </span>
              </div>
              <h4 className="t-display-md text-white">{current.title}</h4>
              <p className="text-sm leading-relaxed text-ink-muted-80 md:text-[15px]">{current.description}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-2.5 pt-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
            >
              Previous
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={activeStep === REVEAL_STEPS.length - 1}
              onClick={() => setActiveStep((prev) => Math.min(REVEAL_STEPS.length - 1, prev + 1))}
              className="gap-1.5"
            >
              <span>Next stage</span>
              <ChevronRight className="size-3.5" aria-hidden />
            </Button>
          </div>
        </div>

        {/* Right: state visual */}
        <div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#0a0d14]"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-primary-bright">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted-48">Contract state</p>
                    <p className="text-sm font-semibold text-white">{current.title}</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted-48">
                  {current.circuit}
                </span>
              </div>

              <div className="p-5">
                {activeStep === 0 && (
                  <div className="space-y-3">
                    <div className="data-block space-y-1 p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted-48">{'// entryAccumulator'}</span>
                        <span className="text-[10px] uppercase tracking-wider text-ink-muted-48/60">
                          {liveAccumulator ? 'Live' : 'Example'}
                        </span>
                      </div>
                      <div className="break-all text-ink-muted-80">
                        {liveAccumulator ?? '0x8f3c71b4…265c7193a0b4e (illustrative)'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-1 font-mono text-[11px] text-ink-muted-48">
                      <span>Address exposure: none</span>
                      <span>Identity: concealed</span>
                    </div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="space-y-3 py-2">
                    <div className="flex justify-center py-3">
                      <span className="flex size-14 items-center justify-center rounded-full border border-violet/25 bg-violet-soft text-violet">
                        <Lock className="size-6" aria-hidden />
                      </span>
                    </div>
                    <p className="text-center font-mono text-xs text-ink-muted-80">
                      Entry pool locked · state → <span className="text-amber">DRAW_PENDING</span>
                    </p>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-3">
                    <div className="data-block space-y-1 p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted-48">{'// winningCommitment'}</span>
                        <span className="text-[10px] uppercase tracking-wider text-ink-muted-48/60">
                          {liveCommitment ? 'Live' : 'Example'}
                        </span>
                      </div>
                      <div className="break-all font-medium text-violet">
                        {liveCommitment ?? '0x46aff717…c0892a71 (illustrative)'}
                      </div>
                    </div>
                    <p className="px-1 font-mono text-[11px] text-ink-muted-48">
                      Publicly readable by all nodes via the Midnight indexer.
                    </p>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-4 py-3 text-center">
                    <div className="inline-flex items-center gap-2 rounded-pill border border-primary/25 bg-primary-soft px-4 py-1.5 font-mono text-xs text-primary-bright">
                      <KeyRound className="size-3.5" aria-hidden />
                      <span>Matching secret against winning commitment…</span>
                    </div>
                    <p className="px-2 font-mono text-[11px] leading-relaxed text-ink-muted-48">
                      Anyone holding a ticket secret can check locally whether it derives the disclosed commitment —
                      without publishing anything.
                    </p>
                  </div>
                )}

                {activeStep === 4 && (
                  <div className="space-y-4 py-3 text-center">
                    <div className="flex justify-center">
                      <span className="flex size-14 items-center justify-center rounded-full border border-emerald/25 bg-emerald-soft text-emerald">
                        <Trophy className="size-6" aria-hidden />
                      </span>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">Prize claim proven</p>
                      <p className="mt-1 font-mono text-[11px] text-ink-muted-80">
                        Ownership verified in zero knowledge · identity never disclosed
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
