import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.ComponentProps<'input'> {
  /** Render in monospace with tabular numerals — for addresses, hashes, amounts. */
  mono?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, mono = false, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-md border border-white/10 bg-[#0b0e16] px-4 text-sm text-white transition-all',
        'placeholder:text-ink-muted-48/70',
        'focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20',
        'disabled:cursor-not-allowed disabled:opacity-40',
        mono && 'font-mono text-[13px] tracking-tight tnum',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
