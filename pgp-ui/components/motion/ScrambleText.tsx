'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const GLYPHS = '01ABCDEF0123456789#/\\<>*+=—•';

interface ScrambleTextProps {
  text: string;
  /** Runs the decode when true; otherwise renders scrambled-or-plain per `idle`. */
  active?: boolean;
  /** What to show before the decode runs. */
  idle?: 'plain' | 'scrambled';
  /** Milliseconds between character resolves. */
  speed?: number;
  className?: string;
  as?: 'span' | 'p' | 'div' | 'code';
  'aria-label'?: string;
}

/**
 * Encrypted-text decode.
 *
 * Copy resolves left to right out of a hex/glyph soup — a small, deliberate nod
 * to the fact that everything in this protocol starts as ciphertext. Static text
 * under `prefers-reduced-motion`, and always exposed to assistive tech via the
 * real string.
 */
export function ScrambleText({
  text,
  active = true,
  idle = 'plain',
  speed = 34,
  className,
  as: Tag = 'span',
  'aria-label': ariaLabel,
}: ScrambleTextProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(idle === 'plain' ? text : '');
  const frameRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(text);
      return;
    }

    if (!active) {
      setDisplay(idle === 'plain' ? text : scramble(text));
      return;
    }

    startedAtRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAtRef.current;
      const resolved = Math.floor(elapsed / speed);

      if (resolved >= text.length) {
        setDisplay(text);
        frameRef.current = null;
        return;
      }

      setDisplay(scramble(text, resolved));
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [text, active, idle, speed, reduceMotion]);

  return (
    <Tag className={className}>
      {/* The real string stays in the accessibility tree; only the visual
          decode is hidden, so screen readers never hear the glyph soup. */}
      <span className="sr-only">{ariaLabel ?? text}</span>
      <span aria-hidden>{display}</span>
    </Tag>
  );
}

function scramble(text: string, resolved = 0): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (i < resolved || char === ' ') {
      out += char;
      continue;
    }
    out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }
  return out;
}
