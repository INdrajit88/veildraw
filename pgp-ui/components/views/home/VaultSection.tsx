'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Play, Radio, ShieldCheck, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/motion/Magnetic';
import { RevealText, SectionReveal } from '@/components/motion/RevealText';
import { ScrambleText } from '@/components/motion/ScrambleText';
import { useVaultRun, type VaultPhase } from '@/hooks/useVaultRun';
import { truncateHex } from '@/lib/utils';
import { networkCapitalized } from '@/lib/network';
import { ease } from '@/lib/motion';
import type { GiveawayItem } from '@/lib/types';

interface VaultSectionProps {
  giveaway: GiveawayItem;
  indexerConnected: boolean;
  onOpenReveal: () => void;
}

const VERDICTS: Record<Exclude<VaultPhase, 'spinning'>, string> = {
  verified: 'WINNER VERIFIED',
  participant: 'PRIVATE PARTICIPANT',
  proof: 'PROOF AVAILABLE',
};

/** Act 05 · VERIFIABLE RANDOMNESS — the cylindrical cryptographic vault. */
export function VaultSection({ giveaway, indexerConnected, onOpenReveal }: VaultSectionProps) {
  const { running, phase, start } = useVaultRun();
  const reduceMotion = useReducedMotion();

  const liveCommitment = indexerConnected && giveaway.winningCommitment.length > 0 ? giveaway.winningCommitment : null;
  const verdict = phase && phase !== 'spinning' ? VERDICTS[phase] : null;

  return (
    <div className="relative mx-auto flex w-full max-w-grid flex-col gap-10 lg:h-full lg:justify-between">
      <SectionReveal className="text-center">
        <p className="eyebrow justify-center">Verifiable randomness</p>
        <RevealText
          as="h2"
          id="vault-heading"
          lines={['Not a spinning wheel.', 'A sealed vault.']}
          className="t-section-immersive mt-5"
        />
      </SectionReveal>

      {/* Verdict overlay — sits over the vault while it resolves. */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-center px-6 lg:static lg:z-auto lg:translate-y-0">
        <AnimatePresence mode="wait">
          {verdict ? (
            <motion.div
              key={phase}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.38, ease }}
              className="veil-glass-strong rounded-pill px-7 py-3.5"
              role="status"
              aria-live="polite"
            >
              <ScrambleText
                as="p"
                text={verdict}
                speed={24}
                className="font-display text-lg font-semibold tracking-[0.02em] text-white sm:text-xl"
              />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted-48"
            >
              <Trophy className="size-3.5" aria-hidden />
              {running ? 'Fragments converging' : 'Vault sealed'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control panel */}
      <div className="veil-glass-strong veil-edge relative overflow-hidden rounded-lg p-6 md:p-8">
        <div className="grid gap-7 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <h3 className="t-tagline">The draw, visualised</h3>
            <p className="t-body mt-2.5 max-w-xl leading-relaxed">
              Encrypted ticket fragments spin inside the vault, decelerate, and resolve on one. This is a visualisation
              of the selection step — the winning commitment itself is chosen by the organizer and posted on-chain
              through the CLI.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Magnetic strength={0.2}>
                <Button variant="hero" onClick={start} disabled={running} className="gap-2.5">
                  <Play className="size-4" aria-hidden />
                  <span>{running ? 'Drawing' : 'Run the draw'}</span>
                </Button>
              </Magnetic>
              <Magnetic strength={0.16}>
                <Button variant="heroSecondary" onClick={onOpenReveal} className="gap-2">
                  <ShieldCheck className="size-4" aria-hidden />
                  <span>Open winner reveal</span>
                </Button>
              </Magnetic>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="data-block space-y-2 p-4">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted-48">{'// winningCommitment'}</span>
                <span className="text-[10px] uppercase tracking-wider text-ink-muted-48/60">
                  {liveCommitment ? 'Live' : 'Standby'}
                </span>
              </div>
              {liveCommitment ? (
                <p className="break-all font-medium text-violet" title={liveCommitment}>
                  {truncateHex(liveCommitment, 14, 12)}
                </p>
              ) : (
                <p className="flex items-start gap-2 text-ink-muted-80">
                  <Radio className="mt-0.5 size-3.5 shrink-0 text-amber" aria-hidden />
                  <span>
                    No commitment posted yet on {networkCapitalized}. Connect a contract address in Settings to stream
                    live state.
                  </span>
                </p>
              )}
              <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 text-[11px] text-ink-muted-48">
                <span>Entries: {indexerConnected ? String(giveaway.entryCount) : '—'}</span>
                <span>{liveCommitment ? 'Fragment derived from this hash' : 'Fragment not derivable'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
