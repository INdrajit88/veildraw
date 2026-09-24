'use client';

import React, { useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronDown, Cpu, Hash, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/motion/Magnetic';
import { RevealText } from '@/components/motion/RevealText';
import { ScrambleText } from '@/components/motion/ScrambleText';
import { sceneState } from '@/lib/scene';
import { networkBadge } from '@/lib/network';
import { ease } from '@/lib/motion';
import type { DrawPhase } from '@/hooks/useDrawSequence';

interface HeroSectionProps {
  /** Current phase of the "Enter the Veil" sequence, or null when idle. */
  phase: DrawPhase | null;
  running: boolean;
  onEnterTheVeil: () => void;
  indexerConnected: boolean;
}

/**
 * The three verdicts. Copy is limited to what the protocol actually guarantees —
 * see the Privacy Model section of README.md.
 */
const VERDICTS = {
  proof: {
    label: 'PROOF GENERATED',
    caption: 'A 32-byte commitment is derived on your device',
  },
  eligible: {
    label: 'ELIGIBILITY VERIFIED',
    caption: 'The commitment is checked inside the ZK circuit',
  },
  hidden: {
    label: 'IDENTITY HIDDEN',
    caption: 'No address or entry list is published on-chain',
  },
} as const;

const ASSURANCES = [
  { icon: ShieldCheck, label: 'Zero entry lists published' },
  { icon: Hash, label: '32-byte commitments only' },
  { icon: Cpu, label: 'Compact ZK circuits' },
] as const;

/** Act 01 · ENTER — Private Participation. */
export function HeroSection({ phase, running, onEnterTheVeil, indexerConnected }: HeroSectionProps) {
  const reduceMotion = useReducedMotion();

  // Hovering the primary CTA charges the scene: particles tighten, the core
  // spins up and the shield brightens. Written straight to the bridge so no
  // React state is involved.
  const charge = useCallback(() => {
    sceneState.energy = 1;
  }, []);
  const discharge = useCallback(() => {
    sceneState.energy = 0;
  }, []);

  const onHowItWorks = useCallback(() => {
    document.getElementById('how-it-works')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [reduceMotion]);

  const verdict = phase && phase !== 'converging' ? VERDICTS[phase] : null;

  return (
    <>
      <div className="veil-volumetric pointer-events-none absolute inset-0" aria-hidden />

      <motion.div
        animate={
          reduceMotion ? undefined : { opacity: running ? 0.18 : 1, filter: running ? 'blur(3px)' : 'blur(0px)' }
        }
        transition={{ duration: 0.7, ease }}
        className="relative mx-auto w-full max-w-grid"
      >
        <div className="max-w-2xl">
          <RevealText as="p" text={`${networkBadge} · Private giveaways`} className="eyebrow" onMount stagger={0.012} />

          <RevealText
            as="h1"
            id="hero-headline"
            lines={['Giveaways Without', 'Exposing Your Identity.']}
            className="t-hero-immersive mt-6"
            onMount
            delay={0.08}
          />

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: reduceMotion ? 0 : 0.42, ease }}
            className="t-lead mt-7 max-w-xl"
          >
            Verify eligibility, participate privately, and discover provably fair winners without publicly exposing
            participant identity.
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: reduceMotion ? 0 : 0.54, ease }}
            className="mt-10 flex flex-wrap items-center gap-3.5"
          >
            <Magnetic strength={0.22}>
              <Button
                variant="hero"
                className="gap-2.5"
                onClick={onEnterTheVeil}
                onPointerEnter={charge}
                onPointerLeave={discharge}
                onFocus={charge}
                onBlur={discharge}
                disabled={running}
              >
                <span>{running ? 'Entering the veil' : 'Enter the veil'}</span>
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </Magnetic>

            <Magnetic strength={0.16}>
              <Button variant="heroSecondary" onClick={onHowItWorks} className="gap-2">
                <span>How it works</span>
                <ChevronDown className="size-4" aria-hidden />
              </Button>
            </Magnetic>
          </motion.div>

          <motion.ul
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: reduceMotion ? 0 : 0.72, ease }}
            className="mt-11 flex flex-wrap items-center gap-x-7 gap-y-3"
          >
            {ASSURANCES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-muted-48"
              >
                <Icon className="size-3.5 text-primary" aria-hidden />
                {label}
              </li>
            ))}
          </motion.ul>
        </div>
      </motion.div>

      {/* Verdict overlay — the only text that survives the UI fade. */}
      <AnimatePresence>
        {verdict && (
          <motion.div
            key={phase}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.45, ease }}
            className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
            role="status"
            aria-live="polite"
          >
            <ScrambleText
              as="p"
              text={verdict.label}
              speed={26}
              className="font-display text-[clamp(28px,6vw,64px)] font-semibold tracking-[-0.03em] text-white"
            />
            <p className="mt-4 max-w-md font-mono text-[11px] uppercase tracking-[0.16em] text-primary-bright">
              {verdict.caption}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indexer status — real connection state, never simulated. */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 lg:block">
        <div className="veil-glass flex items-center gap-2.5 rounded-pill px-4 py-2">
          <span
            className={indexerConnected ? 'size-1.5 rounded-full bg-emerald' : 'size-1.5 rounded-full bg-amber'}
            aria-hidden
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted-80">
            {indexerConnected ? 'Indexer live' : 'Indexer standby'}
          </span>
          <span className="h-3 w-px bg-white/10" aria-hidden />
          <ChevronDown className="size-3.5 animate-bounce text-ink-muted-48" aria-hidden />
        </div>
      </div>
    </>
  );
}
