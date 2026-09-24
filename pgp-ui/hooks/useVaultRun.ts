'use client';

import { useEffect, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { easeOutCubic, useTimeline } from './useTimeline';
import { sceneState } from '@/lib/scene';

export type VaultPhase = 'spinning' | 'verified' | 'participant' | 'proof';

/**
 * The vault draw: spin-up → deceleration → resolution → the caps part.
 *
 * `vaultTrigger` is combined with the scroll-derived value in the frame loop as
 * `max(scroll, trigger)`, so running the draw from the button never fights the
 * scroll story — whichever is further along wins.
 */
const TOTAL_MS = 6400;
const RAMP_END = 0.52;
const HOLD_END = 0.88;

const PHASES = [
  { at: 0, name: 'spinning' },
  { at: 0.58, name: 'verified' },
  { at: 0.72, name: 'participant' },
  { at: 0.86, name: 'proof' },
] as const;

export function useVaultRun() {
  const reduceMotion = useReducedMotion();

  const options = useMemo(
    () => ({
      total: TOTAL_MS,
      phases: PHASES,
      reducedMotion: !!reduceMotion,
      reducedStepMs: 1000,
      reducedHoldMs: 1600,
      onProgress: (p: number) => {
        let value: number;
        if (p < RAMP_END) {
          value = easeOutCubic(p / RAMP_END);
        } else if (p < HOLD_END) {
          value = 1;
        } else {
          value = 1 - (p - HOLD_END) / (1 - HOLD_END);
        }
        sceneState.vaultTrigger = value;
      },
      onEnd: () => {
        sceneState.vaultTrigger = 0;
      },
    }),
    [reduceMotion],
  );

  const { running, phase, start, cancel } = useTimeline(options);

  useEffect(
    () => () => {
      sceneState.vaultTrigger = 0;
    },
    [],
  );

  return {
    running,
    phase: phase as VaultPhase | null,
    start,
    cancel,
    reducedMotion: !!reduceMotion,
  } as const;
}
