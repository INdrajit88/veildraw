'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { fadeSlideUp } from '@/lib/motion';

interface PageHeaderProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: React.ReactNode;
  /** Optional element on the right side (badges, actions). */
  aside?: React.ReactNode;
}

export function PageHeader({ icon: Icon, eyebrow, title, description, aside }: PageHeaderProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={reduceMotion ? undefined : fadeSlideUp}
      initial={reduceMotion ? false : 'initial'}
      animate="animate"
      className="space-y-3"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl space-y-3">
          <span className="eyebrow">
            <Icon className="size-3.5" aria-hidden />
            <span>{eyebrow}</span>
          </span>
          <h1 className="t-display-lg">{title}</h1>
          <p className="t-body">{description}</p>
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </motion.div>
  );
}
