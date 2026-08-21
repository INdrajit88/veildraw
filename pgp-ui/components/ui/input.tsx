import * as React from 'react';
import { cn } from '@/lib/utils';

// search-input grammar: pill, 44px, hairline-soft border, 17px text
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-pill border border-black/10 bg-canvas px-5 t-body text-ink',
          'placeholder:text-ink-muted-48',
          'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary',
          'disabled:cursor-not-allowed disabled:opacity-40',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
