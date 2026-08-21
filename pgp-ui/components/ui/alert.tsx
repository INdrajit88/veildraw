import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Quiet inline callouts — parchment strips, never loud cards
const alertVariants = cva('w-full rounded-sm px-4 py-3 t-caption [&>svg]:mr-2 [&>svg]:size-4', {
  variants: {
    variant: {
      default: 'bg-parchment text-ink-muted-80 [&>svg]:text-ink-muted-48',
      info: 'bg-primary/10 text-primary [&>svg]:text-primary',
      success: 'bg-primary/10 text-primary [&>svg]:text-primary',
      warning: 'bg-parchment text-ink-muted-80 [&>svg]:text-ink-muted-48',
      error: 'bg-[#ff375f]/10 text-[#d70015] [&>svg]:text-[#d70015]',
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
