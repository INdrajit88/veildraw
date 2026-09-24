'use client';

import React from 'react';
import { Lock } from 'lucide-react';

/**
 * Calm CSS-only stand-in for the WebGL environment.
 *
 * Lives in its own module so it can be rendered *before* the three.js chunk is
 * fetched — importing it must never pull in the 3D bundle. Used both while the
 * bundle loads and permanently when WebGL is unavailable.
 */
export function SceneFallback() {
  return (
    <div className="veil-void fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="veil-volumetric absolute inset-0" />
      <div className="grid-bg absolute inset-0 opacity-60" />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex size-72 items-center justify-center sm:size-96">
          <div className="absolute inset-0 rounded-full border border-primary/20" />
          <div className="absolute inset-8 rounded-full border border-dashed border-violet/15" />
          <div className="absolute inset-16 rounded-full border border-primary/10" />
          <div className="flex size-20 items-center justify-center rounded-full border border-primary/25 bg-primary-soft">
            <Lock className="size-8 text-primary-bright" />
          </div>
        </div>
      </div>

      <div className="veil-noise absolute inset-0" />
    </div>
  );
}
