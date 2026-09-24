'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { useBodyPortal } from '@/hooks/useBodyPortal';

const SPRING = { stiffness: 110, damping: 22, mass: 0.7 } as const;

/**
 * A soft light that trails the cursor.
 *
 * Purely atmospheric: `pointer-events: none` in CSS, hidden entirely for reduced
 * motion and on touch devices, and it never mounts until the pointer has
 * actually moved so it cannot flash in a corner on load.
 */
export function CursorGlow() {
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const host = useBodyPortal();

  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);

  useEffect(() => {
    if (reduceMotion) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(pointer: coarse)').matches) return;

    let active = false;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      if (!active) {
        active = true;
        setEnabled(true);
      }
      x.set(event.clientX);
      y.set(event.clientY);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduceMotion, x, y]);

  if (reduceMotion || !enabled || !host) return null;

  // Portalled to <body> so the page wrapper's transform cannot make it the
  // containing block for this fixed-position element.
  return createPortal(
    <motion.div
      className="veil-cursor-glow"
      style={{ x: springX, y: springY }}
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    />,
    host,
  );
}
