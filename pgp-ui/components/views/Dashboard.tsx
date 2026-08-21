'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ActivityItem, GiveawayItem } from '@/lib/types';
import { networkCapitalized } from '@/lib/network';

interface DashboardProps {
  giveaway: GiveawayItem;
  activities: ActivityItem[];
  indexerConnected: boolean;
}

function stateVariant(state: GiveawayItem['state']): 'open' | 'pending' | 'completed' | 'cancelled' {
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

export function Dashboard({ giveaway, activities, indexerConnected }: DashboardProps) {
  const stats = [
    { label: 'Giveaway State', value: indexerConnected ? giveaway.state.replace(/_/g, ' ') : '—' },
    { label: 'Entry Commitments', value: indexerConnected ? String(giveaway.entryCount) : '—' },
    { label: 'Prize Pool', value: giveaway.prizeDetails ? 'Escrowed' : '—' },
    { label: 'Winner Claimed', value: indexerConnected ? (giveaway.winnerClaimed ? 'Yes' : 'No') : '—' },
  ];

  return (
    <div className="bg-parchment">
      <div className="mx-auto max-w-grid px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="t-display-lg text-ink">Dashboard</h1>
          <p className="t-body mt-3 max-w-2xl text-ink-muted-80">
            {indexerConnected
              ? `Live state of the deployed VeilDraw contract on ${networkCapitalized}.`
              : 'Connect a deployed contract address in Settings to read live on-chain state.'}
          </p>
        </motion.div>

        {/* stat utility cards */}
        <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card>
                <CardContent className="p-6">
                  <p className="t-caption-strong text-ink-muted-48">{s.label}</p>
                  <p className="t-display-lg mt-3 text-ink">{s.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* featured giveaway */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-2"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="t-tagline text-ink">{giveaway.title}</h2>
                    <p className="t-body mt-2 text-ink-muted-80">{giveaway.prizeDetails}</p>
                  </div>
                  <Badge variant={indexerConnected ? stateVariant(giveaway.state) : 'default'}>
                    {indexerConnected ? giveaway.state.replace(/_/g, ' ') : 'Not connected'}
                  </Badge>
                </div>

                <div className="mt-6 rounded-sm bg-parchment px-4 py-3">
                  <p className="t-caption-strong text-ink-muted-48">Deployed contract</p>
                  <p className="mt-1 font-mono text-[13px] text-ink-muted-80 break-all">{giveaway.contractAddress}</p>
                </div>

                <div className="mt-6 flex gap-6">
                  <Link href="/giveaways" className="t-body text-primary hover:underline">
                    Enter giveaway
                  </Link>
                  <Link href="/verify" className="t-body text-primary hover:underline">
                    Verify &amp; claim
                  </Link>
                  <Link href="/analytics" className="t-body text-primary hover:underline">
                    Analytics
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* activity log */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card>
              <CardContent className="p-6">
                <h2 className="t-tagline text-ink">Activity</h2>
                <ul className="mt-4 divide-y divide-divider-soft">
                  {activities.length === 0 && <li className="t-caption py-3 text-ink-muted-48">No activity yet.</li>}
                  {activities.slice(0, 8).map((a, i) => (
                    <li key={`${a.id}-${i}`} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="t-caption-strong text-ink">{a.action}</span>
                        <span className="t-fine-print text-ink-muted-48">{a.status}</span>
                      </div>
                      <p className="t-caption mt-1 text-ink-muted-48">{a.details}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
