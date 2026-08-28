'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Wallet, Zap, Key, ChevronRight, CheckCircle2, Loader2, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
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
    badge: 'Extension',
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
    label: 'Seed Key Store',
    description: 'Local private state key store (CLI)',
    icon: Key,
    badge: 'Headless / CLI',
  },
];

export function WalletModal({ isOpen, onClose, wallet, connectWallet, disconnectWallet }: WalletModalProps) {
  const [mode, setMode] = useState<WalletMode>('select');
  const [customAddr, setCustomAddr] = useState('');
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();
  const prevConnected = useRef(wallet.isConnected);

  // Toast on real connection transitions only
  useEffect(() => {
    if (wallet.isConnected && !prevConnected.current) {
      toast.success(`Wallet connected · ${wallet.walletType ? wallet.walletType.toUpperCase() : 'wallet'}`);
    }
    prevConnected.current = wallet.isConnected;
  }, [wallet.isConnected, wallet.walletType]);

  const handleConnectCustom = () => {
    if (!customAddr.trim() || customAddr.trim().length < 10) return;
    connectWallet('custom', customAddr.trim());
  };

  const handleClose = () => {
    setMode('select');
    setCustomAddr('');
    setCopied(false);
    onClose();
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(wallet.address ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-[460px] p-0 overflow-hidden">
        {wallet.isConnected ? (
          /* ── Connected State ── */
          <div className="p-6">
            <DialogHeader className="p-0 space-y-3">
              <div className="flex size-11 items-center justify-center rounded-full border border-emerald/25 bg-emerald-soft text-emerald">
                <CheckCircle2 className="size-5" aria-hidden />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-lg">Wallet connected</DialogTitle>
                <DialogDescription>
                  Active session via {wallet.walletType?.toUpperCase() ?? 'WALLET'} on {wallet.network}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="data-block mt-5 space-y-3 p-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-ink-muted-48">Account address</p>
                  <button
                    onClick={copied ? undefined : copyAddress}
                    className="press -m-1 rounded p-1 text-ink-muted-48 hover:text-white"
                    aria-label={copied ? 'Address copied' : 'Copy address'}
                  >
                    {copied ? (
                      <CheckCircle2 className="size-3.5 text-emerald" aria-hidden />
                    ) : (
                      <Copy className="size-3.5" aria-hidden />
                    )}
                  </button>
                </div>
                <p className="break-all text-ink">{wallet.address}</p>
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                <span className="text-ink-muted-48">Network</span>
                <span className="text-white">{wallet.network}</span>
              </div>

              {wallet.balance !== '--' && (
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted-48">Balance</span>
                  <span className="tnum text-emerald">{wallet.balance}</span>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleClose}>
                Close
              </Button>
              <Button variant="destructive" className="flex-1" onClick={disconnectWallet}>
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          /* ── Connect State ── */
          <div className="p-6">
            <DialogHeader className="p-0 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-tile-2">
                  <img src="/logo.png" alt="" className="h-6 w-6 object-contain" />
                </span>
                <div className="space-y-0.5">
                  <DialogTitle className="text-lg">Connect wallet</DialogTitle>
                  <DialogDescription>{networkLabel} · Midnight zero-knowledge network</DialogDescription>
                </div>
              </div>

              {wallet.error && (
                <Alert variant="error" className="font-mono text-xs">
                  {wallet.error}
                </Alert>
              )}

              {/* Mode tabs */}
              <div
                role="tablist"
                aria-label="Connection method"
                className="flex gap-1 rounded-md border border-white/[0.06] bg-white/[0.03] p-1"
              >
                {(['select', 'custom'] as const).map((m) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => setMode(m)}
                    className={cn(
                      'flex-1 rounded-[6px] py-1.5 t-button-utility transition-all duration-200',
                      mode === m ? 'bg-primary text-white' : 'text-ink-muted-48 hover:text-white',
                    )}
                  >
                    {m === 'select' ? 'Extension' : 'Custom address'}
                  </button>
                ))}
              </div>
            </DialogHeader>

            <div className="mt-5 space-y-4">
              <AnimatePresence mode="wait" initial={false}>
                {mode === 'select' ? (
                  <motion.div
                    key="select"
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col gap-2.5"
                  >
                    {walletOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isInstalled = opt.id === 'lace' && wallet.isLaceInstalled;
                      const connecting = wallet.isConnecting;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => connectWallet(opt.id)}
                          disabled={connecting}
                          className="press group flex w-full items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.03] p-4 text-left transition-all duration-200 hover:border-primary/40 hover:bg-white/[0.05] disabled:opacity-50"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="flex size-9 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04] text-ink-muted-80 transition-colors group-hover:border-primary/30 group-hover:text-primary-bright">
                              <Icon className="size-4" aria-hidden />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{opt.label}</p>
                              <p className="text-xs text-ink-muted-48">{opt.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {connecting ? (
                              <Loader2 className="size-4 animate-spin text-primary" aria-label="Connecting" />
                            ) : isInstalled ? (
                              <Badge variant="open">Detected</Badge>
                            ) : (
                              <Badge variant="default">{opt.badge}</Badge>
                            )}
                            {!connecting && (
                              <ChevronRight
                                className="size-4 text-ink-muted-48 transition-colors group-hover:text-white"
                                aria-hidden
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                    <p className="pt-1 font-mono text-[11px] leading-relaxed text-ink-muted-48">
                      Seed-based connection is currently CLI-only. In-browser flows use your wallet&rsquo;s local ZK
                      state — secrets never leave your device.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="custom"
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col gap-4"
                  >
                    <p className="text-xs leading-relaxed text-ink-muted-48">
                      Enter your Midnight bech32m wallet address for view-only on-chain state sync.
                    </p>

                    <div className="space-y-1.5">
                      <Label htmlFor="custom-address" className="font-mono text-xs text-ink-muted-80">
                        Bech32m wallet address
                      </Label>
                      <Input
                        id="custom-address"
                        placeholder={addressPlaceholder}
                        value={customAddr}
                        onChange={(e) => setCustomAddr(e.target.value)}
                        className="font-mono text-xs"
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </div>

                    <Button
                      variant="default"
                      className="w-full"
                      onClick={handleConnectCustom}
                      disabled={!customAddr.trim() || customAddr.trim().length < 10}
                    >
                      {wallet.isConnecting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Connecting…
                        </>
                      ) : (
                        'Connect address'
                      )}
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
