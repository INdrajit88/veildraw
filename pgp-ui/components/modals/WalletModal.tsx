'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Zap, Key, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { WalletState } from '@/lib/types';
import { networkCapitalized, networkLabel, addressPlaceholder } from '@/lib/network';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  connectWallet: (type: 'lace' | '1am' | 'seed' | 'custom', customAddress?: string) => void;
  disconnectWallet: () => void;
}

type WalletMode = 'select' | 'custom';

const walletOptions = [
  {
    id: 'lace' as const,
    label: 'Lace Wallet',
    description: `${networkCapitalized} browser extension`,
    icon: Wallet,
    badge: 'Chrome Extension',
  },
  {
    id: '1am' as const,
    label: '1AM Wallet',
    description: 'Remote wallet connector',
    icon: Zap,
    badge: '1AM Connector',
  },
  {
    id: 'seed' as const,
    label: 'Seed Import',
    description: 'Local private state key store (CLI)',
    icon: Key,
    badge: 'Headless',
  },
];

export function WalletModal({ isOpen, onClose, wallet, connectWallet, disconnectWallet }: WalletModalProps) {
  const [mode, setMode] = useState<WalletMode>('select');
  const [customAddr, setCustomAddr] = useState('');

  const handleConnectCustom = () => {
    if (!customAddr.trim() || customAddr.trim().length < 10) return;
    connectWallet('custom', customAddr.trim());
  };

  const handleClose = () => {
    setMode('select');
    setCustomAddr('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-[460px]">
        {wallet.isConnected ? (
          /* ── Connected state ── */
          <div>
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>Wallet connected</DialogTitle>
              <DialogDescription>
                Connected via {wallet.walletType?.toUpperCase() ?? 'wallet'} on {wallet.network}
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-2">
              <div className="rounded-sm bg-parchment p-4">
                <p className="t-caption-strong text-ink-muted-48">Account address</p>
                <p className="mt-1 font-mono text-[13px] text-ink break-all">{wallet.address}</p>
                <Separator className="my-3" />
                <div className="flex items-center justify-between">
                  <span className="t-caption text-ink-muted-48">{wallet.network}</span>
                  {wallet.balance !== '--' && <span className="t-body-strong text-primary">{wallet.balance}</span>}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-4">
              <Button variant="secondary" className="flex-1" onClick={handleClose}>
                Close
              </Button>
              <Button variant="destructive" className="flex-1" onClick={disconnectWallet}>
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          /* ── Connect state ── */
          <div>
            <DialogHeader className="p-6 pb-4">
              <div className="mb-3 flex items-center gap-3">
                <img src="/icon.svg" alt="" className="h-8 w-8" />
                <div>
                  <DialogTitle>Connect Wallet</DialogTitle>
                  <DialogDescription className="mt-0.5">{networkLabel} testnet</DialogDescription>
                </div>
              </div>

              {wallet.error && (
                <div className="mt-2 rounded-sm bg-[#ff375f]/10 px-3 py-2 t-caption text-[#d70015]">{wallet.error}</div>
              )}

              {/* mode tabs — pearl capsules */}
              <div className="mt-4 flex gap-1 rounded-md bg-divider-soft p-1">
                {(['select', 'custom'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      'press flex-1 rounded-sm py-1.5 t-button-utility',
                      mode === m ? 'bg-canvas text-ink' : 'text-ink-muted-48',
                    )}
                  >
                    {m === 'select' ? 'Browser Extension' : 'Custom Address'}
                  </button>
                ))}
              </div>
            </DialogHeader>

            <div className="px-6 pb-6">
              <AnimatePresence mode="wait">
                {mode === 'select' ? (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col gap-2"
                  >
                    {walletOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isInstalled = opt.id === 'lace' && wallet.isLaceInstalled;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => connectWallet(opt.id)}
                          className="press flex w-full items-center justify-between rounded-lg border border-hairline bg-canvas p-4 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-ink-muted-48" />
                            <div>
                              <p className="t-body-strong text-ink">{opt.label}</p>
                              <p className="t-caption text-ink-muted-48">{opt.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isInstalled ? (
                              <Badge variant="open">Detected</Badge>
                            ) : (
                              <Badge variant="default">{opt.badge}</Badge>
                            )}
                            <ChevronRight className="h-4 w-4 text-ink-muted-48" />
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    key="custom"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col gap-4"
                  >
                    <p className="t-caption text-ink-muted-48">
                      Enter your Bech32 wallet address for view-only access.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="custom-address">Wallet address</Label>
                      <Input
                        id="custom-address"
                        placeholder={addressPlaceholder}
                        value={customAddr}
                        onChange={(e) => setCustomAddr(e.target.value)}
                        className="font-mono !text-[13px]"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleConnectCustom}
                      disabled={!customAddr.trim() || customAddr.trim().length < 10}
                    >
                      Connect address
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
