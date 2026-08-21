import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Button grammars from DESIGN.md §Components/Buttons
const buttonVariants = cva(
  'press inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-focus disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // button-primary — the signature blue pill
        default: 'rounded-pill bg-primary px-[22px] py-[11px] t-body text-white',
        // button-secondary-pill — ghost pill
        secondary: 'rounded-pill border border-primary bg-transparent px-[22px] py-[11px] t-body text-primary',
        // button-pearl-capsule
        pearl: 'rounded-md bg-pearl px-[14px] py-2 t-caption text-ink-muted-80 ring-[3px] ring-divider-soft ring-inset',
        // button-dark-utility
        dark: 'rounded-sm bg-ink px-[15px] py-2 t-button-utility text-white',
        // button-store-hero — larger pill, rare weight 300
        hero: 'rounded-pill bg-primary px-7 py-3.5 t-button-large text-white',
        // destructive — ink utility rect, visually distinct from the blue action
        destructive: 'rounded-sm bg-ink px-[15px] py-2 t-button-utility text-white',
        ghost: 'rounded-sm bg-transparent px-3 py-2 t-button-utility text-primary',
        link: 'bg-transparent t-body text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: '',
        sm: 'px-4 py-1.5 t-caption',
        lg: 'px-7 py-3.5 t-button-large',
        icon: 'size-11 rounded-full bg-chip/65 text-ink',
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
