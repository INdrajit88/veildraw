'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Cpu, Layers, ShieldCheck, Activity, ExternalLink, DatabaseZap } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { stateLabel } from '@/lib/giveaway';
import type { GiveawayItem } from '@/lib/types';
import { networkCapitalized, indexerUrl } from '@/lib/network';
import { slideInRight } from '@/lib/motion';

interface AnalyticsViewProps {
  giveaway: GiveawayItem;
  indexerConnected: boolean;
}

export function AnalyticsView({ giveaway, indexerConnected }: AnalyticsViewProps) {
  const reduceMotion = useReducedMotion();

  const metrics = [
    {
      label: 'Giveaway state',
      value: indexerConnected ? stateLabel(giveaway.state) : 'Standby',
      accent: indexerConnected ? 'text-white' : 'text-ink-muted-48',
      icon: Activity,
    },
    {
      label: 'Registered commitments',
      value: indexerConnected ? String(giveaway.entryCount) : '—',
      accent: 'text-white',
      icon: Layers,
    },
    {
      label: 'Claim status',
      value: indexerConnected ? (giveaway.winnerClaimed ? 'Claimed' : 'Unclaimed') : '—',
      accent: indexerConnected && giveaway.winnerClaimed ? 'text-emerald' : 'text-white',
      icon: ShieldCheck,
    },
    {
      label: 'ZK circuits in contract',
      value: '5',
      accent: 'text-violet',
      icon: Cpu,
      note: 'create · enter · close · claim · cancel',
    },
  ];

  return (
    <div className="min-h-[85vh] px-6 py-16">
      <div className="mx-auto max-w-grid space-y-10">
        <PageHeader
          icon={Cpu}
          eyebrow="Telemetry"
          title="Protocol analytics"
          description={
            indexerConnected
              ? `Cryptographic state streamed live from the Midnight indexer on ${networkCapitalized}.`
              : 'Connect a deployed contract address in Settings to view live accumulator telemetry.'
          }
          aside={
            <a
              href={indexerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-pill border border-white/10 bg-white/[0.03] px-4 py-2 t-button-utility text-ink-muted-80 transition-colors hover:border-white/20 hover:text-white"
            >
              <span>Open indexer</span>
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          }
        />

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.label}
                variants={reduceMotion ? undefined : slideInRight}
                initial={reduceMotion ? false : 'initial'}
                animate="animate"
                transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.05 * i }}
              >
                <Card className="veil-card veil-card-hover h-full p-6">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted-48">{m.label}</p>
                    <span className="flex size-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-ink-muted-80">
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                  </div>
                  <p className={`tnum mt-3 truncate font-mono text-xl font-semibold md:text-2xl ${m.accent}`}>
                    {m.value}
                  </p>
                  {m.note && <p className="mt-1 truncate font-mono text-[10px] text-ink-muted-48">{m.note}</p>}
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Ledger readout */}
        <Card className="p-0">
          <CardContent className="p-6 space-y-5 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
              <div>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary-bright">
                  Cryptographic ledger readout
                </span>
                <h2 className="t-tagline mt-1 text-white">On-chain commitment accumulator</h2>
              </div>
              <Badge variant={indexerConnected ? 'open' : 'default'}>
                {indexerConnected ? 'Live stream' : 'Standby'}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="data-block space-y-1.5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-ink-muted-48">{'// entryAccumulator — current tree root'}</span>
                  <span className="text-[10px] uppercase tracking-wider text-ink-muted-48/60">
                    Order-bound persistentHash
                  </span>
                </div>
                <p
                  className={
                    giveaway.entryAccumulator
                      ? 'break-all text-sm font-medium text-primary-bright'
                      : 'text-xs text-ink-muted-48'
                  }
                >
                  {indexerConnected ? giveaway.entryAccumulator || '(initial tree root)' : '(indexer standby)'}
                </p>
              </div>

              <div className="data-block space-y-1.5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-ink-muted-48">{'// winningCommitment — disclosed by organizer'}</span>
                  <span className="text-[10px] uppercase tracking-wider text-ink-muted-48/60">
                    32-byte secret digest
                  </span>
                </div>
                <p
                  className={
                    giveaway.winningCommitment
                      ? 'break-all text-sm font-medium text-violet'
                      : 'text-xs text-ink-muted-48'
                  }
                >
                  {indexerConnected ? giveaway.winningCommitment || '(not yet posted)' : '(indexer standby)'}
                </p>
              </div>

              <div className="data-block space-y-1.5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-ink-muted-48">{'// organizerPk — witness-bound public key'}</span>
                  <span className="text-[10px] uppercase tracking-wider text-ink-muted-48/60">
                    publicKey(localSecretKey)
                  </span>
                </div>
                <p
                  className={
                    giveaway.organizerPk ? 'break-all text-sm font-medium text-emerald' : 'text-xs text-ink-muted-48'
                  }
                >
                  {indexerConnected ? giveaway.organizerPk || '(unbound)' : '(indexer standby)'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/[0.05] bg-white/[0.02] p-3.5">
              <p className="flex items-center gap-2 font-mono text-[11px] text-ink-muted-48">
                <DatabaseZap className="size-3.5 text-primary" aria-hidden />
                Raw contract state is queryable by anyone — no private material is exposed.
              </p>
              <a
                href={indexerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-muted-80 underline-offset-4 hover:text-white hover:underline"
              >
                Query {networkCapitalized} indexer GraphQL
                <ExternalLink className="size-3" aria-hidden />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
