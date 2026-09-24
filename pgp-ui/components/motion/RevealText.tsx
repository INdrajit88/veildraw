'use client';

import React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ease } from '@/lib/motion';

interface RevealTextProps {
  /** Single line of copy. Ignored when `lines` is provided. */
  text?: string;
  /** Explicit line breaks — each entry renders as its own block. */
  lines?: readonly string[];
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  /** Applied to the rendered element, e.g. for `aria-labelledby` targets. */
  id?: string;
  className?: string;
  /** Per-word stagger in seconds. */
  stagger?: number;
  delay?: number;
  /** Reveal once on scroll into view (default) or immediately on mount. */
  onMount?: boolean;
}

const word: Variants = {
  initial: { y: '118%' },
  animate: { y: '0%', transition: { duration: 0.66, ease } },
};

/**
 * Line-mask text reveal.
 *
 * Each word is clipped by an overflow-hidden mask and slides up into place, so a
 * headline reads as printed rather than faded in. `.reveal-line` carries the
 * descender padding that keeps glyphs like "g" and "y" from being clipped.
 * Under `prefers-reduced-motion` it renders as plain static text.
 */
export function RevealText({
  text,
  lines,
  as: Tag = 'h2',
  id,
  className,
  stagger = 0.045,
  delay = 0,
  onMount = false,
}: RevealTextProps) {
  const reduceMotion = useReducedMotion();
  const content: readonly string[] = lines ?? (text ? [text] : []);

  if (reduceMotion) {
    return (
      <Tag id={id} className={className}>
        {content.map((line, index) => (
          <span key={index} className="block">
            {line}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag id={id} className={className}>
      <motion.span
        variants={{ initial: {}, animate: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
        initial="initial"
        {...(onMount ? { animate: 'animate' } : { whileInView: 'animate', viewport: { once: true, margin: '-70px' } })}
        className="block"
      >
        {content.map((line, lineIndex) => {
          const words = line.split(' ');
          return (
            <span key={lineIndex} className="block">
              {words.map((item, wordIndex) => (
                <span key={wordIndex} className="reveal-line inline-block align-bottom">
                  <motion.span variants={word} className="inline-block">
                    {item}
                    {wordIndex < words.length - 1 ? '\u00A0' : ''}
                  </motion.span>
                </span>
              ))}
            </span>
          );
        })}
      </motion.span>
    </Tag>
  );
}

/** Fade-and-rise wrapper for whole sections, using the shared motion easing. */
export function SectionReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-90px' }}
      transition={{ duration: reduceMotion ? 0.3 : 0.62, delay: reduceMotion ? 0 : delay, ease }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
