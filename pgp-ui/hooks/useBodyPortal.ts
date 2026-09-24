'use client';

import { useEffect, useState } from 'react';

/**
 * Resolve `document.body` as a portal host after mount.
 *
 * Needed because page content is wrapped in a Framer Motion `motion.div` that
 * keeps a `transform` applied after its enter transition. A transformed
 * ancestor becomes the containing block for `position: fixed` descendants, which
 * would pin the immersive canvas and cursor glow to the page instead of the
 * viewport — so both are portalled out to the body.
 *
 * Returns `null` during SSR/prerender and on the first client render.
 */
export function useBodyPortal(): HTMLElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHost(document.body);
  }, []);

  return host;
}
