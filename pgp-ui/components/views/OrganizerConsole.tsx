'use client';

import React, { useState } from 'react';
import { Shield, PlusCircle, Trophy, Ban, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { stateLabel } from '@/lib/giveaway';
import type { GiveawayItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface OrganizerConsoleProps {
  giveaway: GiveawayItem;
  createGiveawayAction: (title: string, prizeDetails: string, onSuccess: () => void) => void;
  closeAndSelectWinnerAction: (winningCommitment: string, onSuccess: () => void) => void;
  cancelGiveawayAction: (onSuccess: () => void) => void;
  contractAddress: string;
  indexerConnected: boolean;
  setGiveaway: React.Dispatch<React.SetStateAction<GiveawayItem>>;
}

const LIFECYCLE: { key: GiveawayItem['state']; label: string }[] = [
  { key: 'REGISTRATION_OPEN', label: 'Registration open' },
  { key: 'DRAW_PENDING', label: 'Draw pending' },
  { key: 'COMPLETED', label: 'Completed' },
];

// Lifecycle indicator — mirrors the contract state machine (real data only)
function LifecycleIndicator({ state }: { state: GiveawayItem['state'] }) {
  const activeIdx = LIFECYCLE.findIndex((s) => s.key === state);

  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#0d1017] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted-48">Contract lifecycle</p>
        <span className="font-mono text-xs text-ink-muted-80">{stateLabel(state)}</span>
      </div>

      <ol className="mt-4 flex items-center gap-2" aria-label={`Lifecycle position: ${stateLabel(state)}`}>
        {LIFECYCLE.map((step, i) => {
          const isActive = i === activeIdx;
          const isDone = activeIdx > i;
          const isCancelled = state === 'CANCELLED';
          return (
            <React.Fragment key={step.key}>
              {i > 0 && (
                <span
                  className={cn(
                    'h-px flex-1',
                    isCancelled || (!isDone && !isActive) ? 'bg-white/[0.08]' : 'bg-primary/50',
                  )}
                  aria-hidden
                />
              )}
              <li className="flex items-center gap-2">
                <span
                  className={cn(
                    'size-2.5 rounded-full',
                    isCancelled
                      ? 'bg-rose'
                      : isActive
                        ? 'bg-primary shadow-glow-primary'
                        : isDone
                          ? 'bg-emerald'
                          : 'bg-white/15',
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    'font-mono text-[11px] uppercase tracking-wider',
                    isActive ? 'text-white' : 'text-ink-muted-48',
                  )}
                >
                  {step.label}
                </span>
              </li>
            </React.Fragment>
          );
        })}
      </ol>

      {state === 'CANCELLED' && (
        <p className="mt-3 font-mono text-[11px] text-rose">
          Cancelled by the organizer — the lifecycle ended before the prize was claimed.
        </p>
      )}
    </div>
  );
}

export function OrganizerConsole({
  giveaway,
  createGiveawayAction,
  closeAndSelectWinnerAction,
  cancelGiveawayAction,
  indexerConnected,
  setGiveaway,
}: OrganizerConsoleProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newPrize, setNewPrize] = useState('');
  const [winningCommitmentInput, setWinningCommitmentInput] = useState('');

  const registrationOpen = giveaway.state === 'REGISTRATION_OPEN';
  const alreadyInitialized = indexerConnected && !!giveaway.title;

  const handleCreateGiveaway = () => {
    if (!newTitle.trim() || !newPrize.trim()) return;
    createGiveawayAction(newTitle, newPrize, () => {
      setGiveaway((prev) => ({
        ...prev,
        title: newTitle,
        prizeDetails: newPrize,
        state: 'REGISTRATION_OPEN',
        entryCount: 0,
      }));
      setNewTitle('');
      setNewPrize('');
    });
  };

  const handleCloseAndSelectWinner = () => {
    if (!winningCommitmentInput.trim()) return;
    closeAndSelectWinnerAction(winningCommitmentInput, () => {
      setGiveaway((prev) => ({
        ...prev,
        state: 'DRAW_PENDING',
        winningCommitment: winningCommitmentInput,
      }));
      setWinningCommitmentInput('');
    });
  };

  const handleCancelGiveaway = () => {
    cancelGiveawayAction(() => {
      setGiveaway((prev) => ({ ...prev, state: 'CANCELLED' }));
    });
  };

  return (
    <div className="min-h-[85vh] px-6 py-16">
      <div className="mx-auto max-w-content space-y-10">
        <PageHeader
          icon={Shield}
          eyebrow="Organizer console"
          title="Manage the giveaway"
          description="Deploy, draw, and cancel — every action is guarded by organizer-bound ZK circuits."
          aside={
            <Badge
              variant={
                indexerConnected
                  ? giveaway.state === 'REGISTRATION_OPEN'
                    ? 'open'
                    : giveaway.state === 'DRAW_PENDING'
                      ? 'pending'
                      : giveaway.state === 'COMPLETED'
                        ? 'completed'
                        : 'cancelled'
                  : 'default'
              }
            >
              {indexerConnected ? stateLabel(giveaway.state) : 'Indexer standby'}
            </Badge>
          }
        />

        {!indexerConnected && (
          <Alert variant="warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              No contract connected. Enter a deployed VeilDraw contract address in{' '}
              <a href="/settings" className="underline underline-offset-2 hover:text-white">
                Settings
              </a>{' '}
              first.
            </span>
          </Alert>
        )}

        <LifecycleIndicator state={indexerConnected ? giveaway.state : 'REGISTRATION_OPEN'} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Action 01: Create */}
          <Card className="p-0">
            <CardContent className="p-6 space-y-5 md:p-8">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary-bright">
                    Action 01
                  </span>
                  <h2 className="t-tagline mt-1 text-white">Create a giveaway</h2>
                </div>
                <span className="flex size-9 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-primary-bright">
                  <PlusCircle className="size-4" aria-hidden />
                </span>
              </div>

              <p className="text-xs leading-relaxed text-ink-muted-48">
                Initializes giveaway metadata and binds your public key via the createGiveaway() ZK witness. Each
                contract instance hosts one giveaway.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="g-title" className="font-mono text-xs text-ink-muted-80">
                    Giveaway title
                  </Label>
                  <Input
                    id="g-title"
                    placeholder="e.g. Midnight VIP Ecosystem Drop"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="g-prize" className="font-mono text-xs text-ink-muted-80">
                    Prize details &amp; terms
                  </Label>
                  <Input
                    id="g-prize"
                    placeholder="e.g. 5,000 tNIGHT + Private Pass"
                    value={newPrize}
                    onChange={(e) => setNewPrize(e.target.value)}
                  />
                  <p className="pt-1 text-[11px] leading-relaxed text-ink-muted-48">
                    Prize transfer is arranged off-chain — the contract proves claim eligibility, not custody.
                  </p>
                </div>

                <Button
                  variant="default"
                  className="w-full"
                  disabled={!indexerConnected || !newTitle.trim() || !newPrize.trim()}
                  onClick={handleCreateGiveaway}
                >
                  Deploy giveaway to ledger
                </Button>

                {alreadyInitialized && (
                  <p className="text-[11px] leading-relaxed text-ink-muted-48">
                    Note: this instance already has giveaway details set — the circuit rejects a second createGiveaway()
                    on the same deployment.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action 02: Close & Select Winner */}
          <Card className="p-0">
            <CardContent className="p-6 space-y-5 md:p-8">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-violet">
                    Action 02
                  </span>
                  <h2 className="t-tagline mt-1 text-white">Close &amp; select winner</h2>
                </div>
                <span className="flex size-9 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-violet">
                  <Trophy className="size-4" aria-hidden />
                </span>
              </div>

              <p className="text-xs leading-relaxed text-ink-muted-48">
                Posts the drawn winning commitment and seals registration via closeAndSelectWinner(). Once posted, the
                commitment is immutable.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="w-commitment" className="font-mono text-xs text-ink-muted-80">
                    Winning commitment hash (64-char hex)
                  </Label>
                  <Input
                    id="w-commitment"
                    mono
                    placeholder="e.g. 46aff717417086838261bea1896c2b8b…"
                    value={winningCommitmentInput}
                    onChange={(e) => setWinningCommitmentInput(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                <Button
                  variant="default"
                  className="w-full"
                  disabled={!indexerConnected || !registrationOpen || !winningCommitmentInput.trim()}
                  onClick={handleCloseAndSelectWinner}
                >
                  Post winner &amp; close entries
                </Button>

                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={!indexerConnected || !registrationOpen}
                  onClick={handleCancelGiveaway}
                >
                  <Ban className="size-4" aria-hidden />
                  Cancel active giveaway
                </Button>

                <div className="data-block space-y-1.5 p-3.5">
                  <div className="flex justify-between">
                    <span className="text-ink-muted-48">Registered entries</span>
                    <span className="tnum text-white">{indexerConnected ? giveaway.entryCount : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted-48">Prize claimed</span>
                    <span className={giveaway.winnerClaimed ? 'text-emerald' : 'text-ink-muted-80'}>
                      {giveaway.winnerClaimed ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
