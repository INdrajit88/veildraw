'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { GiveawayItem } from '@/lib/types';

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

  const handleVerifyAndClaim = () => {
    if (!ticketSecretInput.trim()) return;
    claimPrizeAction(ticketSecretInput, () => {
      setGiveaway((prev) => ({ ...prev, winnerClaimed: true }));
    });
  };

  return (
    <div className="bg-canvas">
      <div className="mx-auto max-w-content px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <h1 className="t-display-lg text-ink">Verify &amp; claim</h1>
            <p className="t-body mt-3 max-w-2xl text-ink-muted-80">
              Prove ticket ownership in zero knowledge. The prize releases without ever linking your address.
            </p>
          </div>
          <Badge variant={indexerConnected ? 'open' : 'default'}>
            {indexerConnected ? giveaway.state.replace(/_/g, ' ') : 'Not connected'}
          </Badge>
        </motion.div>

        {!indexerConnected && (
          <div className="mt-8">
            <Alert variant="warning">
              No contract connected. Enter a deployed VeilDraw contract address in Settings first.
            </Alert>
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <h2 className="t-tagline text-ink">Winning commitment</h2>
              <p className="t-caption mt-2 text-ink-muted-48">Published by the organizer when registration closed.</p>
              <div className="data-block mt-5 p-4">
                <p className="text-ink-muted-48">{'// winningCommitment'}</p>
                <p className="mt-1 break-all text-primary-on-dark">
                  {indexerConnected ? giveaway.winningCommitment || '(not set)' : '(not connected)'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="t-tagline text-ink">Claim your prize</h2>
              <p className="t-caption mt-2 text-ink-muted-48">
                Your ticket secret proves membership against the accumulator — never revealed on-chain.
              </p>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket-secret">Ticket secret</Label>
                  <Input
                    id="ticket-secret"
                    type="password"
                    placeholder="The secret behind your entry commitment"
                    value={ticketSecretInput}
                    onChange={(e) => setTicketSecretInput(e.target.value)}
                  />
                </div>
                <Button
                  variant="hero"
                  className="w-full"
                  disabled={!indexerConnected || !ticketSecretInput.trim()}
                  onClick={handleVerifyAndClaim}
                >
                  Verify &amp; claim prize
                </Button>
                {giveaway.winnerClaimed && <p className="t-caption text-primary">Prize claimed for this giveaway.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
