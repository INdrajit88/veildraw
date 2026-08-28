'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, ArrowRight, ExternalLink, Radio } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GiveawayItem, WalletState } from '@/lib/types';
import { networkCapitalized } from '@/lib/network';

interface LiveGiveawayCardProps {
  giveaway: GiveawayItem;
  indexerConnected: boolean;
  wallet: WalletState;
  onOpenWalletModal: () => void;
}

function stateBadgeVariant(state: GiveawayItem['state']): 'open' | 'pending' | 'completed' | 'cancelled' {
  switch (state) {
    case 'REGISTRATION_OPEN':
      return 'open';
    case 'DRAW_PENDING':
      return 'pending';
    case 'COMPLETED':
      return 'completed';
    default:
      return 'cancelled';
  }
}

function stateLabel(state: GiveawayItem['state']): string {
  switch (state) {
    case 'REGISTRATION_OPEN':
      return 'Registration open';
    case 'DRAW_PENDING':
      return 'Draw pending';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
  }
}

export function LiveGiveawayCard({ giveaway, indexerConnected, wallet, onOpenWalletModal }: LiveGiveawayCardProps) {
  const reduceMotion = useReducedMotion();

  const winnerStatus = giveaway.winnerClaimed
    ? 'Prize claimed'
    : giveaway.state === 'DRAW_PENDING'
      ? 'Winner drawn'
      : giveaway.state === 'REGISTRATION_OPEN'
        ? 'Awaiting draw'
        : '—';

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <Card className="overflow-hidden p-0">
        <div className="p-6 md:p-8">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-primary-bright">
                <ShieldCheck className="size-4" aria-hidden />
              </span>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted-48">
                  {indexerConnected ? 'Live contract state' : 'Contract stream'}
                </p>
                <p className="font-mono text-xs text-ink-muted-80">{networkCapitalized} · Midnight indexer</p>
              </div>
            </div>
            <Badge variant={indexerConnected ? stateBadgeVariant(giveaway.state) : 'default'}>
              {indexerConnected ? stateLabel(giveaway.state) : 'Indexer standby'}
            </Badge>
          </div>

          {/* Title + prize */}
          <div className="mt-6">
            <h3 className="t-display-md tracking-tight text-white">{giveaway.title}</h3>
            <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-ink-muted-80">{giveaway.prizeDetails}</p>
          </div>

          {/* Metrics — real on-chain values only */}
          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.06] sm:grid-cols-4">
            {[
              { label: 'Private entries', value: indexerConnected ? String(giveaway.entryCount) : '—' },
              { label: 'State', value: indexerConnected ? stateLabel(giveaway.state) : 'Standby' },
              { label: 'Winner', value: indexerConnected ? winnerStatus : '—' },
              {
                label: 'Claim',
                value: indexerConnected ? (giveaway.winnerClaimed ? 'Completed' : 'Open') : '—',
              },
            ].map((m) => (
              <div key={m.label} className="bg-[#0d1017] px-4 py-3.5">
                <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-muted-48">{m.label}</dt>
                <dd className="tnum mt-1 truncate font-mono text-sm font-medium text-white">{m.value}</dd>
              </div>
            ))}
          </dl>

          {/* Contract address */}
          <div className="data-block mt-4 space-y-1 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted-48">Deployed contract</span>
              <span className="text-[10px] uppercase tracking-wider text-ink-muted-48/60">Midnight Compact</span>
            </div>
            <p className="break-all text-xs text-ink-muted-80">{giveaway.contractAddress}</p>
          </div>

          {/* Standby guidance */}
          {!indexerConnected && (
            <div className="mt-4 flex items-start gap-2.5 rounded-md border border-amber/20 bg-amber-soft p-3.5">
              <Radio className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden />
              <p className="text-xs leading-relaxed text-ink-muted-80">
                Waiting for the {networkCapitalized} indexer. If this persists, check that a valid contract address is
                set in{' '}
                <Link href="/settings" className="text-white underline underline-offset-2 hover:text-primary-bright">
                  Settings
                </Link>
                .
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] bg-white/[0.015] px-6 py-4 md:px-8">
          <div className="flex flex-wrap items-center gap-2.5">
            {wallet.isConnected ? (
              <Link href="/giveaways">
                <Button variant="default" className="gap-2">
                  <span>Enter giveaway</span>
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              </Link>
            ) : (
              <Button variant="default" onClick={onOpenWalletModal} className="gap-2">
                <span>Connect wallet to enter</span>
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            )}
            <Link href="/verify">
              <Button variant="secondary">Verify &amp; claim</Button>
            </Link>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-muted-48 transition-colors hover:text-white"
          >
            <span>View in dashboard</span>
            <ExternalLink className="size-3" aria-hidden />
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
