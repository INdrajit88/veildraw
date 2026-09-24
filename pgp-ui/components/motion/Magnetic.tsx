'use client';

import React, { useCallback, useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  /** Fraction of the pointer offset applied to the element. */
  strength?: number;
  /** Distance outside the element, in px, that still attracts it. */
  radius?: number;
}

const SPRING = { stiffness: 190, damping: 17, mass: 0.45 } as const;

/**
 * Magnetic pointer attraction.
 *
 * A wrapper only — it adds no semantics, so a `Link` or `Button` inside keeps
 * its own role, href and focus ring. Disabled for reduced motion and on touch
 * devices, where there is no cursor to attract.
 */
export function Magnetic({ children, className, strength = 0.28, radius = 46 }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLSpanElement>) => {
      if (reduceMotion || event.pointerType !== 'mouse') return;
      const node = ref.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const centreX = rect.left + rect.width / 2;
      const centreY = rect.top + rect.height / 2;
      const offsetX = event.clientX - centreX;
      const offsetY = event.clientY - centreY;
      const distance = Math.hypot(offsetX, offsetY);
      const reach = Math.max(rect.width, rect.height) / 2 + radius;

      if (distance > reach) {
        x.set(0);
        y.set(0);
        return;
      }

      // Ease off as the pointer approaches the centre so it settles, not sticks.
      const falloff = 1 - distance / reach;
      x.set(offsetX * strength * (0.4 + falloff));
      y.set(offsetY * strength * (0.4 + falloff));
    },
    [reduceMotion, strength, radius, x, y],
  );

  const onPointerLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  if (reduceMotion) {
    return <span className={cn('inline-block', className)}>{children}</span>;
  }

  return (
    <motion.span
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ x: springX, y: springY }}
      className={cn('inline-block will-change-transform', className)}
    >
      {children}
    </motion.span>
  );
}
