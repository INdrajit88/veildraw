'use client';

import { useEffect, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { easeOutCubic, useTimeline } from './useTimeline';
import { sceneState } from '@/lib/scene';

export type DrawPhase = 'converging' | 'proof' | 'eligible' | 'hidden';

/**
 * The "Enter the Veil" cinematic sequence.
 *
 * UI fades, the camera pushes into the core, particles accelerate inward, the
 * shield brightens, and three verdicts land in order. The 3D side is driven
 * entirely through `sceneState.draw` / `sceneState.dolly`; Framer Motion handles
 * the DOM transitions.
 */
const TOTAL_MS = 6600;
/** Progress at which the ramp into the core finishes and the verdicts begin. */
const RAMP_END = 0.6;
/** Progress at which the hold ends and the scene settles back down. */
const HOLD_END = 0.86;

const PHASES = [
  { at: 0, name: 'converging' },
  { at: 0.42, name: 'proof' },
  { at: 0.6, name: 'eligible' },
  { at: 0.76, name: 'hidden' },
] as const;

export function useDrawSequence() {
  const reduceMotion = useReducedMotion();

  const options = useMemo(
    () => ({
      total: TOTAL_MS,
      phases: PHASES,
      reducedMotion: !!reduceMotion,
      reducedStepMs: 1100,
      reducedHoldMs: 1400,
      onProgress: (p: number) => {
        let value: number;
        if (p < RAMP_END) {
          value = easeOutCubic(p / RAMP_END);
        } else if (p < HOLD_END) {
          value = 1;
        } else {
          value = 1 - (p - HOLD_END) / (1 - HOLD_END);
        }
        sceneState.draw = value;
        sceneState.dolly = value * 0.9;
      },
      onEnd: () => {
        sceneState.draw = 0;
        sceneState.dolly = 0;
        // The CTA is disabled while the sequence runs, so its pointerleave never
        // fires — release the hover charge here or the scene stays agitated.
        sceneState.energy = 0;
      },
    }),
    [reduceMotion],
  );

  const { running, phase, start, cancel } = useTimeline(options);

  // Never leave the scene wound up if the component unmounts mid-sequence.
  useEffect(
    () => () => {
      sceneState.draw = 0;
      sceneState.dolly = 0;
      sceneState.energy = 0;
    },
    [],
  );

  return {
    running,
    phase: phase as DrawPhase | null,
    start,
    cancel,
    reducedMotion: !!reduceMotion,
  } as const;
}
