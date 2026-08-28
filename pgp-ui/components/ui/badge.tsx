import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'border border-white/10 bg-white/5 text-ink-muted-80',
        outline: 'border border-white/15 bg-transparent text-ink-muted-80',
        // live / registration open
        open: 'border border-primary/25 bg-primary-soft text-primary-bright',
        // draw pending / awaiting
        pending: 'border border-amber/25 bg-amber-soft text-amber',
        // completed / confirmed
        completed: 'border border-emerald/25 bg-emerald-soft text-emerald',
        cancelled: 'border border-white/10 bg-white/5 text-ink-muted-48',
        error: 'border border-rose/25 bg-rose-soft text-rose',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
