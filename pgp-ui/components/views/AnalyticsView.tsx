'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import type { GiveawayItem } from '@/lib/types';
import { networkCapitalized } from '@/lib/network';

interface AnalyticsViewProps {
  giveaway: GiveawayItem;
  indexerConnected: boolean;
}

export function AnalyticsView({ giveaway, indexerConnected }: AnalyticsViewProps) {
  const metrics = [
    {
      label: 'Giveaway State',
      value: indexerConnected ? giveaway.state.replace(/_/g, ' ') : '—',
      small: true,
    },
    { label: 'Entry Commitments', value: indexerConnected ? String(giveaway.entryCount) : '—' },
    { label: 'Winner Claimed', value: indexerConnected ? (giveaway.winnerClaimed ? 'Yes' : 'No') : '—' },
    { label: 'ZK Circuits', value: '5' },
  ];

  return (
    <div>
      {/* light tile — metrics */}
      <section className="bg-canvas">
        <div className="mx-auto max-w-grid px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="t-display-lg text-ink">Protocol analytics</h1>
            <p className="t-body mt-3 max-w-2xl text-ink-muted-80">
              {indexerConnected
                ? `Live state read from the on-chain VeilDraw contract on ${networkCapitalized}.`
                : 'Connect a deployed contract in Settings to view live on-chain state.'}
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card>
                  <CardContent className="p-6">
                    <p className="t-caption-strong text-ink-muted-48">{m.label}</p>
                    <p className={`${m.small ? 't-tagline' : 't-display-lg'} mt-3 text-ink`}>{m.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* dark tile — raw accumulator */}
      <section className="bg-tile-3">
        <div className="mx-auto max-w-content px-6 py-20">
          <h2 className="t-display-lg text-white">On-chain commitment accumulator</h2>
          <p className="t-lead mt-4 text-body-muted">Raw cryptographic state from the ledger.</p>

          <div className="data-block mt-10 space-y-6 bg-transparent p-0 font-mono">
            <div>
              <p className="t-caption text-ink-muted-48">{'// entryAccumulator (current)'}</p>
              <p className="mt-1 break-all text-[15px] text-primary-on-dark">
                {indexerConnected ? giveaway.entryAccumulator || '(empty)' : '(not connected)'}
              </p>
            </div>
            <div>
              <p className="t-caption text-ink-muted-48">{'// winningCommitment'}</p>
              <p className="mt-1 break-all text-[15px] text-primary-on-dark">
                {indexerConnected ? giveaway.winningCommitment || '(not set)' : '(not connected)'}
              </p>
            </div>
            <div>
              <p className="t-caption text-ink-muted-48">{'// organizerPk'}</p>
              <p className="mt-1 break-all text-[15px] text-primary-on-dark">
                {indexerConnected ? giveaway.organizerPk || '(not set)' : '(not connected)'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
