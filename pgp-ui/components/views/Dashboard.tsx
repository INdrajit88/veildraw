'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, Lock, Shield, Award, Sparkles, ArrowRight, Inbox, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { stateBadgeVariant, stateLabel } from '@/lib/giveaway';
import type { ActivityItem, GiveawayItem } from '@/lib/types';
import { networkCapitalized } from '@/lib/network';
import { slideInRight } from '@/lib/motion';

interface DashboardProps {
  giveaway: GiveawayItem;
  activities: ActivityItem[];
  indexerConnected: boolean;
}

export function Dashboard({ giveaway, activities, indexerConnected }: DashboardProps) {
  const reduceMotion = useReducedMotion();

  const winnerValue = !indexerConnected
    ? '—'
    : giveaway.winnerClaimed
      ? 'Claimed'
      : giveaway.state === 'DRAW_PENDING'
        ? 'Drawn'
        : 'Awaiting';

  const stats = [
    {
      label: 'Giveaway state',
      value: indexerConnected ? stateLabel(giveaway.state) : 'Standby',
      accent: indexerConnected ? 'text-white' : 'text-ink-muted-48',
      icon: Lock,
    },
    {
      label: 'Private entries',
      value: indexerConnected ? String(giveaway.entryCount) : '—',
      accent: 'text-white',
      icon: Shield,
    },
    {
      label: 'Prize',
      value: giveaway.prizeDetails
        ? giveaway.prizeDetails.length > 18
          ? `${giveaway.prizeDetails.slice(0, 18)}…`
          : giveaway.prizeDetails
        : '—',
      accent: 'text-emerald',
      icon: Award,
    },
    {
      label: 'Winner',
      value: winnerValue,
      accent: giveaway.winnerClaimed && indexerConnected ? 'text-emerald' : 'text-white',
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-[85vh] px-6 py-16">
      <div className="mx-auto max-w-grid space-y-10">
        <PageHeader
          icon={Activity}
          eyebrow="Control center"
          title="Protocol dashboard"
          description={
            indexerConnected
              ? `Real-time state for the active VeilDraw contract on ${networkCapitalized}.`
              : 'Connect a deployed contract address in Settings to subscribe to live on-chain state.'
          }
          aside={
            <Badge variant={indexerConnected ? stateBadgeVariant(giveaway.state) : 'default'}>
              {indexerConnected ? stateLabel(giveaway.state) : 'Indexer standby'}
            </Badge>
          }
        />

        {!indexerConnected && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber/20 bg-amber-soft p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden />
              <p className="text-xs leading-relaxed text-ink-muted-80">
                Waiting for the {networkCapitalized} indexer. Metrics will fill in automatically once the contract
                stream connects.
              </p>
            </div>
            <Link href="/settings">
              <Button variant="secondary" size="sm">
                Open settings
              </Button>
            </Link>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                variants={reduceMotion ? undefined : slideInRight}
                initial={reduceMotion ? false : 'initial'}
                animate="animate"
                transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.05 * i }}
              >
                <Card className="veil-card veil-card-hover h-full p-6">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted-48">{s.label}</p>
                    <span className="flex size-7 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-ink-muted-80">
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                  </div>
                  <p className={`tnum mt-3 truncate font-mono text-xl font-semibold md:text-2xl ${s.accent}`}>
                    {s.value}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Active giveaway */}
          <motion.div
            variants={reduceMotion ? undefined : slideInRight}
            initial={reduceMotion ? false : 'initial'}
            animate="animate"
            transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.2 }}
            className="lg:col-span-8"
          >
            <Card className="h-full p-0">
              <CardContent className="p-6 space-y-5 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-primary-bright">
                      Active giveaway
                    </span>
                    <h2 className="t-display-md mt-1.5 text-white">{giveaway.title}</h2>
                    <p className="t-body mt-2">{giveaway.prizeDetails}</p>
                  </div>
                  <Badge variant={indexerConnected ? stateBadgeVariant(giveaway.state) : 'default'}>
                    {indexerConnected ? stateLabel(giveaway.state) : 'Standby'}
                  </Badge>
                </div>

                <div className="data-block space-y-1 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted-48">Deployed contract</span>
                    <span className="text-[10px] uppercase tracking-wider text-ink-muted-48/60">
                      {networkCapitalized}
                    </span>
                  </div>
                  <p className="break-all text-xs text-ink-muted-80">{giveaway.contractAddress}</p>
                </div>

                <div className="flex flex-wrap gap-2.5 border-t border-white/[0.06] pt-5">
                  <Link href="/giveaways">
                    <Button variant="default" size="sm" className="gap-1.5">
                      <span>Enter giveaway</span>
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Button>
                  </Link>
                  <Link href="/verify">
                    <Button variant="secondary" size="sm">
                      Verify &amp; claim
                    </Button>
                  </Link>
                  <Link href="/organizer">
                    <Button variant="secondary" size="sm">
                      Organizer console
                    </Button>
                  </Link>
                  <Link href="/analytics">
                    <Button variant="ghost" size="sm">
                      Analytics
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity log */}
          <motion.div
            variants={reduceMotion ? undefined : slideInRight}
            initial={reduceMotion ? false : 'initial'}
            animate="animate"
            transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.25 }}
            className="lg:col-span-4"
          >
            <Card className="h-full p-0">
              <CardContent className="flex h-full flex-col p-6">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
                    Recent activity
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted-48">
                    Local session
                  </span>
                </div>

                {activities.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
                    <span className="flex size-11 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-ink-muted-48">
                      <Inbox className="size-5" aria-hidden />
                    </span>
                    <p className="text-sm font-medium text-ink-muted-80">No activity recorded yet</p>
                    <p className="max-w-[220px] text-xs leading-relaxed text-ink-muted-48">
                      Wallet connections and transaction attempts will appear here.
                    </p>
                  </div>
                ) : (
                  <ul className="mt-4 space-y-2.5" aria-live="polite">
                    {activities.slice(0, 6).map((a, i) => (
                      <li key={`${a.id}-${i}`} className="rounded-md border border-white/[0.05] bg-white/[0.02] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-white">{a.action}</span>
                          <Badge
                            variant={
                              a.status === 'Confirmed' ? 'completed' : a.status === 'Failed' ? 'error' : 'pending'
                            }
                            className="shrink-0 px-2 py-0.5 text-[10px]"
                          >
                            {a.status}
                          </Badge>
                        </div>
                        <p className="mt-1 break-words text-[11px] leading-relaxed text-ink-muted-48">{a.details}</p>
                        <span className="mt-1 block font-mono text-[10px] text-ink-muted-48/70">{a.timestamp}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
