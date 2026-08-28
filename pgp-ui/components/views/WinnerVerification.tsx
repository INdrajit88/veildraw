'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck, Ticket, AlertTriangle, Trophy, CheckCircle2, ShieldQuestion } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { stateBadgeVariant, stateLabel } from '@/lib/giveaway';
import type { GiveawayItem } from '@/lib/types';
import { networkCapitalized } from '@/lib/network';

interface WinnerVerificationProps {
  giveaway: GiveawayItem;
  claimPrizeAction: (ticketSecretHex: string, onSuccess: () => void) => void;
  contractAddress: string;
  indexerConnected: boolean;
  setGiveaway: React.Dispatch<React.SetStateAction<GiveawayItem>>;
}

export function WinnerVerification({
  giveaway,
  claimPrizeAction,
  indexerConnected,
  setGiveaway,
}: WinnerVerificationProps) {
  const [ticketSecretInput, setTicketSecretInput] = useState('');
  const reduceMotion = useReducedMotion();

  const drawPending = giveaway.state === 'DRAW_PENDING';
  const claimOpen = drawPending && !giveaway.winnerClaimed;

  const handleClaim = () => {
    if (!ticketSecretInput.trim()) return;
    claimPrizeAction(ticketSecretInput, () => {
      setGiveaway((prev) => ({ ...prev, winnerClaimed: true }));
      setTicketSecretInput('');
    });
  };

  return (
    <div className="min-h-[85vh] px-6 py-16">
      <div className="mx-auto max-w-content space-y-10">
        <PageHeader
          icon={BadgeCheck}
          eyebrow="Winner verification"
          title="Verify your ticket &amp; claim"
          description="Check the disclosed winning commitment, then prove your ticket in zero knowledge to claim the prize — without revealing your identity."
          aside={
            <Badge variant={indexerConnected ? stateBadgeVariant(giveaway.state) : 'default'}>
              {indexerConnected ? stateLabel(giveaway.state) : 'Indexer standby'}
            </Badge>
          }
        />

        {!indexerConnected && (
          <Alert variant="warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              No live contract connected. Set a deployed VeilDraw contract address in{' '}
              <a href="/settings" className="underline underline-offset-2 hover:text-white">
                Settings
              </a>{' '}
              to see the on-chain draw and claim the prize.
            </span>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Card 1: On-chain draw state */}
          <Card className="p-0">
            <CardContent className="p-6 space-y-5 md:p-8">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary-bright">
                    On-chain readout
                  </span>
                  <h2 className="t-tagline mt-1 text-white">Winning commitment</h2>
                </div>
                <span className="flex size-9 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-primary-bright">
                  <ShieldQuestion className="size-4" aria-hidden />
                </span>
              </div>

              <div className="space-y-3">
                <div className="data-block space-y-1.5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted-48">{'// winningCommitment'}</span>
                    <span className="text-[10px] uppercase tracking-wider text-ink-muted-48/60">
                      {indexerConnected ? 'Live' : 'Standby'}
                    </span>
                  </div>
                  <p className={giveaway.winningCommitment ? 'break-all font-medium text-violet' : 'text-ink-muted-48'}>
                    {indexerConnected ? giveaway.winningCommitment || '(not yet posted)' : '(indexer standby)'}
                  </p>
                </div>

                <div className="data-block space-y-2.5 p-4">
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-muted-48">Prize</span>
                    <span className="text-right text-white">{giveaway.prizeDetails || '—'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-muted-48">Registered entries</span>
                    <span className="tnum text-white">{indexerConnected ? giveaway.entryCount : '—'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-muted-48">Claim status</span>
                    <span className={giveaway.winnerClaimed ? 'text-emerald' : 'text-white'}>
                      {indexerConnected ? (giveaway.winnerClaimed ? 'Claimed' : 'Open') : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-ink-muted-48">Network</span>
                    <span className="text-white">{networkCapitalized}</span>
                  </div>
                </div>
              </div>

              {giveaway.winnerClaimed && indexerConnected && (
                <Alert variant="success">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>The prize has already been claimed. Claiming is single-shot by design.</span>
                </Alert>
              )}

              {indexerConnected && drawPending && !giveaway.winnerClaimed && (
                <Alert variant="info">
                  <Trophy className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    The draw has been posted and the prize is unclaimed. If your local ticket derives the disclosed
                    commitment, claim it now.
                  </span>
                </Alert>
              )}

              {indexerConnected && giveaway.state === 'REGISTRATION_OPEN' && (
                <Alert variant="default">
                  <Ticket className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    No draw has been posted yet. Entries are still open — check back after the organizer closes
                    registration.
                  </span>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Claim flow */}
          <Card className="p-0">
            <CardContent className="p-6 space-y-5 md:p-8">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald">
                    Claim flow
                  </span>
                  <h2 className="t-tagline mt-1 text-white">Prove your ticket</h2>
                </div>
                <span className="flex size-9 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-emerald">
                  <Ticket className="size-4" aria-hidden />
                </span>
              </div>

              <p className="text-xs leading-relaxed text-ink-muted-48">
                Enter the ticket secret you generated when you entered. The claim circuit proves that your secret
                derives the disclosed commitment — the secret itself never reaches the ledger.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ticket-secret" className="font-mono text-xs text-ink-muted-80">
                    Your ticket secret
                  </Label>
                  <Input
                    id="ticket-secret"
                    type="password"
                    placeholder="The secret from your entry"
                    value={ticketSecretInput}
                    onChange={(e) => setTicketSecretInput(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                <Button
                  variant="hero"
                  className="w-full"
                  disabled={!indexerConnected || !claimOpen || !ticketSecretInput.trim()}
                  onClick={handleClaim}
                >
                  Verify &amp; claim prize
                </Button>

                <p className="text-[11px] leading-relaxed text-ink-muted-48">
                  {indexerConnected
                    ? claimOpen
                      ? 'Claiming is only possible while state is DRAW_PENDING and the prize is unclaimed.'
                      : 'This claim window is closed — see the on-chain readout.'
                    : 'Connect a contract in Settings to enable claiming.'}
                </p>
              </div>

              {giveaway.winnerClaimed && indexerConnected && (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-lg border border-emerald/25 bg-emerald-soft p-4"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald/30 bg-emerald-soft text-emerald">
                    <Trophy className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">Prize claimed</p>
                    <p className="text-xs text-ink-muted-80">
                      The claim was verified in zero knowledge — the winner&rsquo;s identity was never disclosed.
                    </p>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
