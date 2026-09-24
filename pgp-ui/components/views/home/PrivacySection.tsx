'use client';

import React from 'react';
import { ArrowRight, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { RevealText, SectionReveal } from '@/components/motion/RevealText';
import { cn } from '@/lib/utils';

/** What a conventional giveaway tool ends up publishing. */
const TRADITIONAL_CHAIN = ['Wallet', 'Address', 'Participant data', 'Public winner'] as const;

/** What VeilDraw publishes instead. */
const VEIL_CHAIN = ['Wallet', 'Cryptographic proof', 'Eligibility verified', 'Identity concealed'] as const;

const STAYS_PRIVATE = [
  'Participant secret keys',
  'Ticket secrets & nonces',
  'Losing entries',
  'Identity & wallet linkage',
] as const;

const GOES_ON_CHAIN = ['Entry accumulator root', 'Entry counter', 'Winning commitment', 'Claim status'] as const;

function Chain({
  steps,
  tone,
  label,
  icon: Icon,
}: {
  steps: readonly string[];
  tone: 'leak' | 'sealed';
  label: string;
  icon: typeof EyeOff;
}) {
  const sealed = tone === 'sealed';

  return (
    <div
      className={cn(
        'veil-glass relative flex-1 overflow-hidden rounded-lg p-6 md:p-7',
        sealed ? 'border-primary/25' : 'border-rose/20',
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-md border',
            sealed ? 'border-primary/30 bg-primary-soft text-primary-bright' : 'border-rose/25 bg-rose-soft text-rose',
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <h3
          className={cn(
            'font-mono text-[11px] font-medium uppercase tracking-[0.16em]',
            sealed ? 'text-primary-bright' : 'text-rose',
          )}
        >
          {label}
        </h3>
      </div>

      <ol className="mt-6 space-y-0">
        {steps.map((step, index) => (
          <li key={step}>
            <div className="flex items-baseline gap-3">
              <span
                className={cn('tnum font-mono text-[10px]', sealed ? 'text-primary/60' : 'text-rose/50')}
                aria-hidden
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span
                className={cn(
                  'text-[15px] font-medium',
                  sealed ? 'text-white' : 'text-ink-muted-80',
                  !sealed && index === steps.length - 1 && 'text-rose',
                  sealed && index === steps.length - 1 && 'text-emerald',
                )}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <span className={cn('ml-[7px] block h-5 w-px', sealed ? 'bg-primary/25' : 'bg-rose/20')} aria-hidden />
            )}
          </li>
        ))}
      </ol>

      <p className="mt-6 border-t border-white/[0.06] pt-4 text-xs leading-relaxed text-ink-muted-48">
        {sealed
          ? 'Everything after the wallet happens inside a proof. The ledger learns that a claim was valid, not who made it.'
          : 'Every step after the wallet is published, correlated and permanently searchable.'}
      </p>
    </div>
  );
}

/** Act 03 · PRIVACY — leaking data on the left, sealed data on the right. */
export function PrivacySection() {
  return (
    <div className="relative mx-auto w-full max-w-grid">
      <div className="veil-scrim pointer-events-none absolute -inset-x-16 -inset-y-8 hidden lg:block" aria-hidden />

      <div className="relative">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">Privacy</p>
          <RevealText
            as="h2"
            id="privacy-heading"
            lines={['Data exists.', 'Identity does not escape.']}
            className="t-section-immersive mt-5"
          />
        </SectionReveal>

        <div className="mt-12 flex flex-col gap-5 md:flex-row">
          <Chain steps={TRADITIONAL_CHAIN} tone="leak" label="Traditional giveaway" icon={EyeOff} />

          <div className="flex items-center justify-center md:flex-col" aria-hidden>
            <span className="hidden h-px w-8 bg-white/10 md:block" />
            <ArrowRight className="size-4 rotate-90 text-ink-muted-48 md:rotate-0" />
          </div>

          <Chain steps={VEIL_CHAIN} tone="sealed" label="VeilDraw" icon={ShieldCheck} />
        </div>

        {/* The real split, from the protocol's privacy model. */}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="veil-glass rounded-lg p-6">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted-48">
              <Lock className="size-3.5 text-primary" aria-hidden />
              Stays on your device
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {STAYS_PRIVATE.map((item) => (
                <li
                  key={item}
                  className="rounded-pill border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 text-xs text-ink-muted-80"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="veil-glass rounded-lg p-6">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted-48">
              <ShieldCheck className="size-3.5 text-violet" aria-hidden />
              Published on-chain
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {GOES_ON_CHAIN.map((item) => (
                <li
                  key={item}
                  className="rounded-pill border border-violet/20 bg-violet-soft px-3 py-1.5 text-xs text-ink-muted-80"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
