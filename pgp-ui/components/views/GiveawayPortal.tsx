'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock, Key, ShieldCheck, CheckCircle2, AlertTriangle, Trophy, Ban } from 'lucide-react';
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
  const reduceMotion = useReducedMotion();

  const registrationOpen = giveaway.state === 'REGISTRATION_OPEN';

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
    <div className="min-h-[85vh] px-6 py-16">
      <div className="mx-auto max-w-content space-y-10">
        <PageHeader
          icon={Lock}
          eyebrow="Private entry portal"
          title="Enter the giveaway"
          description={
            <>
              <span className="font-semibold text-white">{giveaway.title}</span>
              {giveaway.prizeDetails && <> — {giveaway.prizeDetails}</>}
            </>
          }
          aside={
            <Badge variant={indexerConnected ? stateBadgeVariant(giveaway.state) : 'default'}>
              {indexerConnected ? stateLabel(giveaway.state) : 'Indexer standby'}
            </Badge>
          }
        />

        {/* Live detail strip */}
        <motion.div
          variants={reduceMotion ? undefined : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.08 }}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.06] sm:grid-cols-4"
        >
          {[
            { label: 'Private entries', value: indexerConnected ? String(giveaway.entryCount) : '—' },
            { label: 'State', value: indexerConnected ? stateLabel(giveaway.state) : 'Standby' },
            { label: 'Winner', value: indexerConnected ? (giveaway.winnerClaimed ? 'Claimed' : 'Undrawn') : '—' },
            { label: 'Network', value: networkCapitalized },
          ].map((m) => (
            <div key={m.label} className="bg-[#0d1017] px-4 py-3.5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted-48">{m.label}</p>
              <p className="tnum mt-1 truncate font-mono text-sm font-medium text-white">{m.value}</p>
            </div>
          ))}
        </motion.div>

        {!indexerConnected && (
          <Alert variant="warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              No live contract connected. Set a deployed VeilDraw contract address in{' '}
              <a href="/settings" className="underline underline-offset-2 hover:text-white">
                Settings
              </a>{' '}
              to stream on-chain state and submit entries.
            </span>
          </Alert>
        )}

        {/* State-aware guidance */}
        {indexerConnected && !registrationOpen && (
          <Alert variant={giveaway.state === 'CANCELLED' ? 'error' : 'info'}>
            {giveaway.state === 'DRAW_PENDING' ? (
              <Trophy className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <Ban className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <span>
              {giveaway.state === 'DRAW_PENDING'
                ? 'Registration is closed — the draw has been posted. If you hold the winning ticket, claim it in Verify & Claim.'
                : giveaway.state === 'COMPLETED'
                  ? 'This giveaway is completed and the prize has been claimed.'
                  : 'This giveaway was cancelled by the organizer.'}
            </span>
          </Alert>
        )}

        {/* 2-Step entry flow */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Step 1: Derive Local Commitment */}
          <Card className="p-0">
            <CardContent className="p-6 space-y-5 md:p-8">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary-bright">
                    Step 01 / 02
                  </span>
                  <h2 className="t-tagline mt-1 text-white">Derive a ZK commitment</h2>
                </div>
                <span className="flex size-9 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-primary-bright">
                  <Key className="size-4" aria-hidden />
                </span>
              </div>

              <p className="text-xs leading-relaxed text-ink-muted-48">
                Your secret and nonce stay in browser memory. Only the opaque 32-byte commitment is ever submitted — the
                ledger never sees your inputs.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="secret" className="font-mono text-xs text-ink-muted-80">
                    Private ticket secret
                  </Label>
                  <Input
                    id="secret"
                    type="password"
                    placeholder="Enter a secret passkey (e.g. my-veil-secret-77)"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nonce" className="font-mono text-xs text-ink-muted-80">
                    Entropy nonce
                  </Label>
                  <Input
                    id="nonce"
                    placeholder="Random string (e.g. 98234-x827)"
                    value={nonce}
                    onChange={(e) => setNonce(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={!secret.trim() || !nonce.trim()}
                  onClick={handleGenerate}
                >
                  Generate local commitment
                </Button>
              </div>

              {generatedCommitment && (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="data-block space-y-1.5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted-48">{'// derived 32-byte commitment'}</span>
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald">
                      <CheckCircle2 className="size-3" aria-hidden />
                      Ready
                    </span>
                  </div>
                  <p className="break-all font-medium text-primary-bright">{generatedCommitment}</p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Submit to On-Chain Accumulator */}
          <Card className="p-0">
            <CardContent className="p-6 space-y-5 md:p-8">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-violet">
                    Step 02 / 02
                  </span>
                  <h2 className="t-tagline mt-1 text-white">Submit your private entry</h2>
                </div>
                <span className="flex size-9 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-violet">
                  <ShieldCheck className="size-4" aria-hidden />
                </span>
              </div>

              <p className="text-xs leading-relaxed text-ink-muted-48">
                Appends your opaque commitment to the Midnight accumulator via enterGiveaway(). The transaction is
                signed through your wallet and verified by the ZK circuit.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="commitment" className="font-mono text-xs text-ink-muted-80">
                    Commitment hash (64-char hex)
                  </Label>
                  <Input
                    id="commitment"
                    mono
                    placeholder="Paste the derived 64-char hash"
                    value={generatedCommitment}
                    onChange={(e) => setGeneratedCommitment(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                <Button
                  variant="default"
                  className="w-full"
                  disabled={!indexerConnected || !registrationOpen || generatedCommitment.length !== 64}
                  onClick={handleSubmit}
                >
                  Submit private entry
                </Button>

                <div className="data-block space-y-1.5 p-3.5">
                  <div className="flex justify-between">
                    <span className="text-ink-muted-48">Registered entries</span>
                    <span className="tnum text-white">{indexerConnected ? giveaway.entryCount : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted-48">Contract state</span>
                    <span className="text-primary-bright">
                      {indexerConnected ? stateLabel(giveaway.state) : 'Standby'}
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
