'use client';

import React from 'react';
import { Settings, Globe, Wallet, Info } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WalletState } from '@/lib/types';
import { networkCapitalized, networkLabel, rpcNodeUrl, indexerUrl } from '@/lib/network';

interface SettingsViewProps {
  contractAddress: string;
  setContractAddress: (addr: string) => void;
  wallet: WalletState;
}

const readEndpoints = [
  { label: 'Proof Server URL (CLI write path)', value: 'http://localhost:6300' },
  { label: `${networkCapitalized} RPC Node`, value: rpcNodeUrl },
  { label: `${networkCapitalized} Indexer GraphQL`, value: indexerUrl },
];

export function SettingsView({ contractAddress, setContractAddress, wallet }: SettingsViewProps) {
  const isValidHex = /^[0-9a-f]{64}$/i.test(contractAddress.trim());

  return (
    <div className="min-h-[85vh] px-6 py-16">
      <div className="mx-auto max-w-content space-y-10">
        <PageHeader
          icon={Settings}
          eyebrow="Configuration"
          title="Protocol settings"
          description="Point the app at a deployed contract, inspect the Midnight endpoints, and review your wallet session."
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Network & contract */}
          <Card className="p-0">
            <CardContent className="p-6 space-y-5 md:p-8">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary-bright">
                    Network configuration
                  </span>
                  <h2 className="t-tagline mt-1 text-white">Contract address</h2>
                </div>
                <span className="flex size-9 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-primary-bright">
                  <Globe className="size-4" aria-hidden />
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="contract-address" className="font-mono text-xs text-ink-muted-80">
                    Active contract address (64-char hex)
                  </Label>
                  <Input
                    id="contract-address"
                    mono
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    placeholder="64-character hex deployment ID"
                    autoComplete="off"
                    spellCheck={false}
                    aria-describedby="contract-address-hint"
                  />
                  <p id="contract-address-hint" className="pt-1 text-[11px] leading-relaxed text-ink-muted-48">
                    {contractAddress.length === 0
                      ? 'Clearing the address stops the live stream.'
                      : isValidHex
                        ? `Subscribing to live contract state on ${networkLabel}.`
                        : 'Waiting for a valid 64-character hex address…'}
                  </p>
                </div>

                <div className="space-y-3 border-t border-white/[0.06] pt-4">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted-48">
                    Read endpoints
                  </span>
                  {readEndpoints.map((ep) => (
                    <div key={ep.label} className="space-y-1">
                      <Label className="font-mono text-xs text-ink-muted-80">{ep.label}</Label>
                      <Input readOnly value={ep.value} className="bg-black/30 font-mono text-xs text-ink-muted-48" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session inspector */}
          <Card className="p-0">
            <CardContent className="p-6 space-y-5 md:p-8">
              <div className="flex items-start justify-between border-b border-white/[0.06] pb-4">
                <div>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-violet">
                    Session inspector
                  </span>
                  <h2 className="t-tagline mt-1 text-white">Wallet connection</h2>
                </div>
                <Badge variant={wallet.isConnected ? 'open' : 'default'}>
                  {wallet.isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>

              <div className="data-block space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted-48">Network</span>
                  <span className="text-white">{wallet.network}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted-48">Wallet provider</span>
                  <span className="text-primary-bright">{wallet.walletType?.toUpperCase() ?? 'NONE'}</span>
                </div>
                {wallet.address && (
                  <div className="space-y-1 border-t border-white/[0.06] pt-3">
                    <p className="text-ink-muted-48">Account address</p>
                    <p className="break-all text-xs text-white">{wallet.address}</p>
                  </div>
                )}
                {wallet.isConnected && wallet.balance !== '--' && (
                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                    <span className="text-ink-muted-48">Balance</span>
                    <span className="tnum text-emerald">{wallet.balance}</span>
                  </div>
                )}
              </div>

              {!wallet.isConnected && (
                <div className="flex items-start gap-2.5 rounded-md border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <Wallet className="mt-0.5 size-4 shrink-0 text-ink-muted-48" aria-hidden />
                  <p className="text-xs leading-relaxed text-ink-muted-48">
                    No wallet session active. Connect Lace or 1AM from the wallet menu to enable on-chain actions.
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2.5 rounded-md border border-primary/20 bg-primary-soft p-3.5">
                <Info className="mt-0.5 size-4 shrink-0 text-primary-bright" aria-hidden />
                <p className="text-[11px] leading-relaxed text-ink-muted-80">
                  In-browser write actions (enter, close, claim) are submitted through your wallet plus the local proof
                  server on the CLI. See the transaction dialog for the exact command when prompted.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
