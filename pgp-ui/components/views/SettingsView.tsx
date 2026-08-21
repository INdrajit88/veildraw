'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { WalletState } from '@/lib/types';
import { networkCapitalized, networkLabel, rpcNodeUrl, indexerUrl } from '@/lib/network';

interface SettingsViewProps {
  contractAddress: string;
  setContractAddress: (addr: string) => void;
  wallet: WalletState;
}

const readEndpoints = [
  { label: 'Proof Server URL', value: 'http://localhost:6300' },
  { label: `${networkCapitalized} RPC Node Endpoint`, value: rpcNodeUrl },
  { label: `${networkCapitalized} Indexer GraphQL Endpoint`, value: indexerUrl },
];

export function SettingsView({ contractAddress, setContractAddress, wallet }: SettingsViewProps) {
  return (
    <div className="bg-parchment">
      <div className="mx-auto max-w-content px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="t-display-lg text-ink">DApp configuration</h1>
          <p className="t-body mt-3 max-w-2xl text-ink-muted-80">
            Configure contract endpoints, proof server connections, and RPC nodes.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* network settings */}
          <Card>
            <CardContent className="p-6">
              <h2 className="t-tagline text-ink">Network settings</h2>
              <p className="t-caption mt-2 text-ink-muted-48">Deployment IDs and read endpoints.</p>

              <div className="mt-6 space-y-2">
                <Label htmlFor="contract-address">Deployed contract address</Label>
                <Input
                  id="contract-address"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  className="font-mono !text-[13px]"
                  placeholder="64-character hex deployment ID"
                />
                <p className="t-fine-print text-ink-muted-48">
                  Canonical deployment ID on the {networkLabel} testnet. Entering a valid address subscribes to live
                  on-chain state.
                </p>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                {readEndpoints.map((ep) => (
                  <div key={ep.label} className="space-y-1.5">
                    <Label className="t-caption text-ink-muted-48">{ep.label}</Label>
                    <Input readOnly value={ep.value} className="font-mono !text-[13px] bg-pearl" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* wallet status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="t-tagline text-ink">Connected wallet status</h2>
                  <p className="t-caption mt-2 text-ink-muted-48">Session and network details.</p>
                </div>
                <Badge variant={wallet.isConnected ? 'open' : 'default'}>
                  {wallet.isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="t-caption text-ink-muted-48">Network</span>
                  <span className="t-body-strong text-ink">{wallet.network}</span>
                </div>

                {wallet.address && (
                  <div className="rounded-sm bg-parchment px-4 py-3">
                    <p className="t-caption-strong text-ink-muted-48">Address</p>
                    <p className="mt-1 font-mono text-[13px] text-ink break-all">{wallet.address}</p>
                  </div>
                )}

                {wallet.isConnected && wallet.balance !== '--' && (
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="t-caption text-ink-muted-48">Balance</span>
                    <span className="t-body-strong text-primary">{wallet.balance}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
