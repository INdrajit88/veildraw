'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import type { GiveawayItem } from '@/lib/types';

interface OrganizerConsoleProps {
  giveaway: GiveawayItem;
  createGiveawayAction: (title: string, prizeDetails: string, onSuccess: () => void) => void;
  closeAndSelectWinnerAction: (winningCommitment: string, onSuccess: () => void) => void;
  cancelGiveawayAction: (onSuccess: () => void) => void;
  contractAddress: string;
  indexerConnected: boolean;
  setGiveaway: React.Dispatch<React.SetStateAction<GiveawayItem>>;
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
    <div className="bg-parchment">
      <div className="mx-auto max-w-content px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="t-display-lg text-ink">Organizer console</h1>
          <p className="t-body mt-3 max-w-2xl text-ink-muted-80">
            Deploy giveaways, draw winners, and manage registration — all via organizer-bound ZK circuits.
          </p>
        </motion.div>

        {!indexerConnected && (
          <div className="mt-8">
            <Alert variant="warning">
              No contract connected. Enter a deployed VeilDraw contract address in Settings first.
            </Alert>
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* create */}
          <Card>
            <CardContent className="p-6">
              <h2 className="t-tagline text-ink">Create new giveaway</h2>
              <p className="t-caption mt-2 text-ink-muted-48">Deploy giveaway configuration to the ledger.</p>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="g-title">Giveaway title</Label>
                  <Input
                    id="g-title"
                    placeholder="e.g. Developer Ecosystem Drop"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="g-prize">Prize description &amp; terms</Label>
                  <Input
                    id="g-prize"
                    placeholder="e.g. 5,000 tNIGHT + Developer Pass"
                    value={newPrize}
                    onChange={(e) => setNewPrize(e.target.value)}
                  />
                </div>
                <Button
                  variant="hero"
                  className="w-full"
                  disabled={!indexerConnected || !newTitle.trim() || !newPrize.trim()}
                  onClick={handleCreateGiveaway}
                >
                  Deploy giveaway to ledger
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* close & draw */}
          <Card>
            <CardContent className="p-6">
              <h2 className="t-tagline text-ink">Close entries &amp; select winner</h2>
              <p className="t-caption mt-2 text-ink-muted-48">
                Post the drawn winning commitment and close registration.
              </p>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="w-commitment">Winning commitment hash (64-char hex)</Label>
                  <Input
                    id="w-commitment"
                    className="font-mono !text-[13px]"
                    placeholder="e.g. 46aff717417086838261bea1896c2b8b…"
                    value={winningCommitmentInput}
                    onChange={(e) => setWinningCommitmentInput(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={!indexerConnected || !winningCommitmentInput.trim()}
                  onClick={handleCloseAndSelectWinner}
                >
                  Post winner &amp; close entries
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={!indexerConnected}
                  onClick={handleCancelGiveaway}
                >
                  Cancel giveaway
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* current state strip */}
        <div className="mt-10 rounded-sm bg-canvas px-5 py-4">
          <p className="t-caption text-ink-muted-48">
            Current state: <span className="t-caption-strong text-ink">{giveaway.state.replace(/_/g, ' ')}</span> ·{' '}
            {giveaway.entryCount} entries registered
          </p>
        </div>
      </div>
    </div>
  );
}
