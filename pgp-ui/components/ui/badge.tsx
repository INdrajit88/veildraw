import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Quiet chip grammar — pill capsules, never loud
const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-pill px-3 py-1 t-caption', {
  variants: {
    variant: {
      default: 'bg-parchment text-ink-muted-80',
      outline: 'border border-hairline bg-canvas text-ink-muted-80',
      // live / open state — the single accent
      open: 'bg-primary/10 text-primary',
      pending: 'bg-parchment text-ink-muted-80',
      completed: 'bg-ink text-white',
      cancelled: 'bg-divider-soft text-ink-muted-48',
      error: 'bg-[#ff375f]/10 text-[#d70015]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
