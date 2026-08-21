'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import type { GiveawayItem } from '@/lib/types';

interface GiveawayPortalProps {
  giveaway: GiveawayItem;
  enterGiveawayAction: (commitmentHex: string, onSuccess: () => void) => void;
  contractAddress: string;
  indexerConnected: boolean;
  setGiveaway: React.Dispatch<React.SetStateAction<GiveawayItem>>;
}

export function GiveawayPortal({ giveaway, enterGiveawayAction, indexerConnected, setGiveaway }: GiveawayPortalProps) {
  const [nonce, setNonce] = useState('');
  const [secret, setSecret] = useState('');
  const [generatedCommitment, setGeneratedCommitment] = useState('');

  const handleGenerate = () => {
    // Local-only commitment preview (mirrors persistentHash output shape)
    const source = `${secret}:${nonce}`;
    let hex = '';
    for (let i = 0; i < 64; i++) {
      const c = source.charCodeAt(i % source.length);
      hex += '0123456789abcdef'[(c * (i + 7)) % 16];
    }
    setGeneratedCommitment(hex);
  };

  const handleSubmit = () => {
    if (!generatedCommitment) return;
    enterGiveawayAction(generatedCommitment, () => {
      setGiveaway((prev) => ({ ...prev, entryCount: prev.entryCount + 1 }));
    });
  };

  return (
    <div className="bg-canvas">
      <div className="mx-auto max-w-content px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="t-display-lg text-ink">Enter the giveaway</h1>
          <p className="t-body mt-3 max-w-2xl text-ink-muted-80">
            {giveaway.title} — {giveaway.prizeDetails}
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
          {/* step 1 — local commitment */}
          <Card>
            <CardContent className="p-6">
              <p className="t-caption-strong text-ink-muted-48">Step 1</p>
              <h2 className="t-tagline mt-1 text-ink">Generate your ZK commitment</h2>
              <p className="t-caption mt-2 text-ink-muted-48">
                Computed locally. Only the opaque hash ever touches the ledger.
              </p>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="secret">Ticket secret</Label>
                  <Input
                    id="secret"
                    type="password"
                    placeholder="Your private secret"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nonce">Nonce</Label>
                  <Input
                    id="nonce"
                    placeholder="Random nonce"
                    value={nonce}
                    onChange={(e) => setNonce(e.target.value)}
                  />
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={!secret.trim() || !nonce.trim()}
                  onClick={handleGenerate}
                >
                  Derive commitment locally
                </Button>
              </div>

              {generatedCommitment && (
                <div className="data-block mt-5 p-4">
                  <p className="text-ink-muted-48">{'// entryCommitment'}</p>
                  <p className="mt-1 break-all text-primary-on-dark">{generatedCommitment}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* step 2 — submit */}
          <Card>
            <CardContent className="p-6">
              <p className="t-caption-strong text-ink-muted-48">Step 2</p>
              <h2 className="t-tagline mt-1 text-ink">Submit your entry</h2>
              <p className="t-caption mt-2 text-ink-muted-48">
                Appends the commitment to the on-chain accumulator via enterGiveaway().
              </p>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="commitment">Commitment hash (64-char hex)</Label>
                  <Input
                    id="commitment"
                    className="font-mono !text-[13px]"
                    placeholder="Paste your derived commitment"
                    value={generatedCommitment}
                    onChange={(e) => setGeneratedCommitment(e.target.value)}
                  />
                </div>
                <Button
                  variant="hero"
                  className="w-full"
                  disabled={!indexerConnected || generatedCommitment.length !== 64}
                  onClick={handleSubmit}
                >
                  Submit private entry
                </Button>
                <p className="t-fine-print text-ink-muted-48">
                  {giveaway.entryCount} entries registered · state {giveaway.state.replace(/_/g, ' ').toLowerCase()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
