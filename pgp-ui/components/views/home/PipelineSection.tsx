'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, type MotionValue } from 'framer-motion';
import { Check } from 'lucide-react';
import { RevealText, SectionReveal } from '@/components/motion/RevealText';
import { STAGE_CENTRE_T } from '@/lib/scene';
import { cn } from '@/lib/utils';
import { ease } from '@/lib/motion';

interface PipelineSectionProps {
  /** The page-level story progress, shared with the scene bridge. */
  scrollYProgress: MotionValue<number>;
}

/**
 * The five acts of the protocol, in the order the contract actually executes
 * them. Circuit names are the real ones from `lib/compact/pgp-contract.d.ts`.
 */
const STAGES = [
  {
    id: 'join',
    label: 'Join',
    circuit: 'enterGiveaway()',
    title: 'Join with a secret',
    body: 'You derive a ticket secret and nonce on your own device. No server receives it, and no entry list is ever created.',
  },
  {
    id: 'commit',
    label: 'Commit',
    circuit: 'commitment',
    title: 'Publish only the commitment',
    body: 'A single 32-byte commitment is appended to the on-chain accumulator. It cannot be reversed into your secret or your address.',
  },
  {
    id: 'select',
    label: 'Select',
    circuit: 'closeAndSelectWinner()',
    title: 'The draw closes',
    body: 'The organizer ends registration and posts one winning commitment. The accumulator freezes and nothing further is disclosed.',
  },
  {
    id: 'prove',
    label: 'Prove',
    circuit: 'persistentHash',
    title: 'Prove ownership',
    body: 'Whoever holds the winning ticket proves inside the circuit that their secret derives the posted commitment.',
  },
  {
    id: 'claim',
    label: 'Claim',
    circuit: 'claimPrize()',
    title: 'Claim without revealing',
    body: 'The prize is released to the prover. The ledger records that a claim happened — never who made it.',
  },
] as const;

/** Index of the stage whose 3D object the camera is nearest to. */
function nearestStage(t: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < STAGE_CENTRE_T.length; i++) {
    const distance = Math.abs(t - STAGE_CENTRE_T[i]);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

/** Act 02 · HOW IT WORKS — the camera dollies along the pipeline. */
export function PipelineSection({ scrollYProgress }: PipelineSectionProps) {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  // Shares the page-level progress value, so the label always matches the
  // object the camera has arrived at rather than drifting out of sync.
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const next = nearestStage(latest);
    setActive((current) => (current === next ? current : next));
  });

  const stage = STAGES[active];

  return (
    <div className="relative mx-auto w-full max-w-grid">
      <div className="veil-scrim pointer-events-none absolute -inset-x-20 -inset-y-10 hidden lg:block" aria-hidden />

      <div className="relative">
        <SectionReveal className="max-w-2xl">
          <p className="eyebrow">The process</p>
          <RevealText
            as="h2"
            id="pipeline-heading"
            lines={['Your identity stays', 'outside the draw.']}
            className="t-section-immersive mt-5"
          />
        </SectionReveal>

        {/* Stage rail — every stage stays in the DOM and readable at all times. */}
        <ol className="mt-12 flex flex-wrap items-center gap-2 sm:gap-3" aria-label="Protocol stages">
          {STAGES.map((item, index) => {
            const isActive = index === active;
            const isPast = index < active;
            return (
              <li key={item.id} className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-current={isActive ? 'step' : undefined}
                  className={cn(
                    'press flex items-center gap-2 rounded-pill border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-300',
                    isActive
                      ? 'border-primary/45 bg-primary-soft text-white shadow-glow-primary'
                      : isPast
                        ? 'border-emerald/25 bg-emerald-soft text-emerald'
                        : 'border-white/[0.08] bg-white/[0.02] text-ink-muted-48 hover:border-white/20 hover:text-ink-muted-80',
                  )}
                >
                  {isPast && !isActive ? (
                    <Check className="size-3" aria-hidden />
                  ) : (
                    <span className="tnum text-[10px] opacity-70">{String(index + 1).padStart(2, '0')}</span>
                  )}
                  {item.label}
                </button>
                {index < STAGES.length - 1 && (
                  <span
                    className={cn(
                      'hidden h-px w-6 transition-colors duration-500 sm:block',
                      index < active ? 'bg-emerald/30' : 'bg-white/10',
                    )}
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ol>

        {/* Detail panel */}
        <div className="veil-glass-strong veil-edge relative mt-8 overflow-hidden rounded-lg p-7 md:p-9">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={stage.id}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
              className="grid gap-7 lg:grid-cols-12 lg:items-start"
            >
              <div className="lg:col-span-7">
                <div className="flex items-center gap-3">
                  <span className="tnum font-mono text-xs text-primary-bright">
                    {String(active + 1).padStart(2, '0')} / 05
                  </span>
                  <span className="h-3 w-px bg-white/10" aria-hidden />
                  <code className="rounded-xs border border-white/[0.08] bg-black/40 px-2 py-0.5 font-mono text-[11px] text-ink-muted-80">
                    {stage.circuit}
                  </code>
                </div>
                <h3 className="t-display-md mt-4">{stage.title}</h3>
                <p className="t-body mt-3 max-w-xl leading-relaxed">{stage.body}</p>
              </div>

              <div className="lg:col-span-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted-48">
                  What the ledger sees
                </p>
                <p className="mt-3 break-all font-mono text-xs leading-relaxed text-ink-muted-80">
                  {active <= 1
                    ? 'One 32-byte commitment, appended to an accumulator. No address. No list.'
                    : active === 2
                      ? 'One winning commitment, posted once registration is closed.'
                      : 'A valid claim transition. The prover’s identity is not part of it.'}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
