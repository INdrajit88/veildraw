'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WalletState } from '@/lib/types';

interface WalletGateProps {
  wallet: WalletState;
  onOpenWalletModal: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function WalletGate({ wallet, onOpenWalletModal, title, description, children }: WalletGateProps) {
  const reduceMotion = useReducedMotion();

  if (!wallet.isConnected) {
    return (
      <div className="ambient flex min-h-[80vh] items-center justify-center px-6 py-20">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="veil-card mx-auto flex max-w-md flex-col items-center gap-6 rounded-xl p-10 text-center"
        >
          <div className="flex size-12 items-center justify-center rounded-full border border-primary/25 bg-primary-soft text-primary-bright">
            <Lock className="h-5 w-5" aria-hidden />
          </div>

          <div className="space-y-2.5">
            <div className="eyebrow justify-center">
              <ShieldCheck className="size-3.5" aria-hidden />
              <span>Wallet required</span>
            </div>
            <h1 className="t-display-md text-white">{title}</h1>
            <p className="t-body mx-auto max-w-sm leading-relaxed">{description}</p>
          </div>

          <Button variant="default" size="lg" className="w-full" onClick={onOpenWalletModal}>
            Connect Midnight Wallet
          </Button>

          <p className="font-mono text-[11px] leading-relaxed text-ink-muted-48">
            Your wallet signs and holds ZK witnesses locally — secrets never leave your device.
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
