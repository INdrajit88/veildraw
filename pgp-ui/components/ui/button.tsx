import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'press inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Primary action — solid midnight indigo pill. The one glow in the system.
        default:
          'rounded-pill bg-primary px-5 py-2.5 t-button-utility text-white hover:bg-primary-bright hover:shadow-glow-primary active:scale-[0.98]',
        // Secondary — quiet surface pill
        secondary:
          'rounded-pill border border-white/10 bg-white/[0.04] px-5 py-2.5 t-button-utility text-ink hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:scale-[0.98]',
        // Large hero action
        hero: 'rounded-pill bg-primary px-7 py-3.5 t-button-large text-white hover:bg-primary-bright hover:shadow-glow-primary active:scale-[0.98]',
        // Large hero secondary
        heroSecondary:
          'rounded-pill border border-white/15 bg-white/[0.03] px-7 py-3.5 t-button-large text-white hover:border-white/30 hover:bg-white/[0.07] active:scale-[0.98]',
        // Subtle dark pill
        pearl:
          'rounded-pill border border-white/10 bg-chip px-4 py-2 t-caption text-ink-muted-80 hover:bg-white/[0.06] hover:text-white',
        // Compact utility rectangle
        dark: 'rounded-md border border-white/10 bg-chip/80 px-4 py-2 t-button-utility text-white hover:bg-chip hover:border-white/20',
        // Destructive
        destructive:
          'rounded-md border border-rose/30 bg-rose-soft px-4 py-2 t-button-utility text-rose hover:border-rose/50 hover:bg-rose/20',
        // Ghost
        ghost:
          'rounded-md bg-transparent px-3 py-2 t-button-utility text-ink-muted-80 hover:bg-white/5 hover:text-white',
        // Link
        link: 'bg-transparent p-0 text-primary hover:text-primary-bright underline-offset-4 hover:underline',
      },
      size: {
        default: '',
        sm: 'px-3.5 py-1.5 text-xs',
        lg: 'px-8 py-3.5 text-base',
        icon: 'size-10 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
