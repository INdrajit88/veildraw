'use client';

/** Handle returned by `scheduleIdle`, with a single cancel path. */
export interface IdleHandle {
  cancel: () => void;
}

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * Run `callback` when the main thread is free, with a hard deadline.
 *
 * Used to keep the WebGL bundle out of the critical path: the page paints its
 * CSS backdrop first, and the 3D environment initializes afterwards instead of
 * competing with hydration.
 */
export function scheduleIdle(callback: () => void, timeout = 1500): IdleHandle {
  if (typeof window === 'undefined') return { cancel: () => {} };

  const w = window as IdleWindow;

  if (w.requestIdleCallback) {
    const handle = w.requestIdleCallback(callback, { timeout });
    return { cancel: () => w.cancelIdleCallback?.(handle) };
  }

  const handle = window.setTimeout(callback, 220);
  return { cancel: () => window.clearTimeout(handle) };
}
