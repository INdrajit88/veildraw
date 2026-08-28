import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva('w-full rounded-md border p-4 text-sm flex items-start gap-3', {
  variants: {
    variant: {
      default: 'border-white/10 bg-white/[0.04] text-ink-muted-80 [&>svg]:text-ink-muted-48',
      info: 'border-primary/25 bg-primary-soft text-primary-bright [&>svg]:text-primary-bright',
      success: 'border-emerald/25 bg-emerald-soft text-emerald [&>svg]:text-emerald',
      warning: 'border-amber/25 bg-amber-soft text-amber [&>svg]:text-amber',
      error: 'border-rose/25 bg-rose-soft text-rose [&>svg]:text-rose',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

function Alert({ className, variant, ...props }: AlertProps) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export { Alert, alertVariants };
