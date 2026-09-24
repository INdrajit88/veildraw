'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ActProps {
  /**
   * Responsive section height. This is what sets how long the camera dwells in
   * the act, so it must stay proportional to the stage windows in `lib/scene.ts`.
   */
  heightClass: string;
  id?: string;
  labelledBy?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * One act of the scroll story.
 *
 * The outer section provides scroll length; the inner box pins to the viewport
 * on large screens so the copy stays readable while the camera travels. On small
 * screens it degrades to normal flow — pinned 100vh panels clip content on
 * short viewports, and a plain scroll is always usable.
 */
export function Act({ heightClass, id, labelledBy, className, children }: ActProps) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn('relative', heightClass, className)}>
      <div className="relative flex min-h-[100svh] w-full flex-col justify-center px-6 py-20 lg:sticky lg:top-[var(--veil-nav-h)] lg:h-[calc(100svh-var(--veil-nav-h))] lg:min-h-0 lg:overflow-hidden lg:py-8">
        {children}
      </div>
    </section>
  );
}
