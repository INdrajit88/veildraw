'use client';

import { useEffect } from 'react';
import { useReducedMotion, type MotionValue } from 'framer-motion';
import { sceneState } from '@/lib/scene';

/**
 * Bind a scroll progress value to the scene bridge.
 *
 * The page owns one `useScroll` and shares the MotionValue with both the bridge
 * and any section that needs the same progress, so there is exactly one scroll
 * observer. Subscribing to `change` writes straight into `sceneState` — no React
 * state — so scrolling never re-renders the tree.
 */
export function useSceneScroll(scrollYProgress: MotionValue<number>): void {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    sceneState.reducedMotion = !!reduceMotion;
  }, [reduceMotion]);

  useEffect(() => {
    // Prime the bridge before the first frame so the camera never snaps from 0.
    const initial = scrollYProgress.get();
    sceneState.scrollRaw = initial;
    sceneState.scroll = initial;

    const unsubscribe = scrollYProgress.on('change', (latest) => {
      sceneState.scrollRaw = latest;
      // Reduced motion renders on demand and does not damp, so track exactly.
      if (sceneState.reducedMotion) sceneState.scroll = latest;
    });
    return unsubscribe;
  }, [scrollYProgress]);
}
