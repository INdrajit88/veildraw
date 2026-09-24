'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** A named moment on the timeline, expressed as normalised progress 0..1. */
export interface TimelinePhase {
  /** Progress at which this phase begins. */
  at: number;
  name: string;
}

export interface TimelineOptions {
  /** Total duration in milliseconds. */
  total: number;
  /** Called on every frame with normalised progress 0..1. */
  onProgress?: (progress: number) => void;
  /** Ordered phase markers; the latest one whose `at` has passed is current. */
  phases?: readonly TimelinePhase[];
  /** Called when a phase boundary is crossed. */
  onPhase?: (name: string) => void;
  /** Called once when the timeline completes. */
  onEnd?: () => void;
  /**
   * When true the timeline degrades to a phase-only walkthrough: markers advance
   * on timers and `onProgress` is never called, so nothing is written to the
   * scene bridge and no animation runs.
   */
  reducedMotion?: boolean;
  /** Dwell time per phase in reduced-motion mode. */
  reducedStepMs?: number;
  /** Extra hold on the final phase in reduced-motion mode. */
  reducedHoldMs?: number;
}

/** Cubic ease-out — fast start, heavy settle. Matches the scene's damping feel. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * A single rAF timeline that publishes progress and named phases.
 *
 * Both cinematic sequences in the immersive experience (the "Enter the Veil"
 * proof run and the vault draw) are configurations of this, so the frame
 * bookkeeping — and the reduced-motion degradation — lives in one place.
 */
export function useTimeline(options: TimelineOptions) {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);

  const optionsRef = useRef<TimelineOptions>(options);
  const frameRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const phaseRef = useRef<string | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const cancel = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => cancel, [cancel]);

  const emitPhase = useCallback((name: string) => {
    if (name === phaseRef.current) return;
    phaseRef.current = name;
    setPhase(name);
    optionsRef.current.onPhase?.(name);
  }, []);

  const start = useCallback(() => {
    if (frameRef.current !== null || timersRef.current.length > 0) return;

    const config = optionsRef.current;
    const phases = config.phases ?? [];
    phaseRef.current = null;
    setPhase(null);
    setRunning(true);

    // ── Reduced motion: phase-only walkthrough, nothing touches the scene ──
    if (config.reducedMotion) {
      const step = config.reducedStepMs ?? 1100;
      const names = phases.map((marker) => marker.name);
      if (names.length === 0) {
        setRunning(false);
        config.onEnd?.();
        return;
      }
      names.forEach((name, index) => {
        timersRef.current.push(window.setTimeout(() => emitPhase(name), index * step));
      });
      timersRef.current.push(
        window.setTimeout(
          () => {
            timersRef.current = [];
            setRunning(false);
            setPhase(null);
            phaseRef.current = null;
            config.onEnd?.();
          },
          names.length * step + (config.reducedHoldMs ?? 1200),
        ),
      );
      return;
    }

    // ── Full timeline ──────────────────────────────────────────────────────
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(1, elapsed / Math.max(1, config.total));

      config.onProgress?.(progress);

      if (phases.length > 0) {
        let current = phases[0].name;
        for (const marker of phases) {
          if (progress >= marker.at) current = marker.name;
        }
        emitPhase(current);
      }

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      frameRef.current = null;
      setRunning(false);
      config.onEnd?.();
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [emitPhase]);

  return { running, phase, start, cancel } as const;
}
