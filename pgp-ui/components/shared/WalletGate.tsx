'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
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
  if (!wallet.isConnected) {
    return (
      <section className="bg-parchment">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex max-w-content flex-col items-center px-6 py-20 text-center"
        >
          <div className="flex size-11 items-center justify-center rounded-full bg-chip/65">
            <Lock className="h-5 w-5 text-ink" />
          </div>
          <h1 className="t-display-lg mt-8 text-ink">{title}</h1>
          <p className="t-lead mt-4 max-w-xl text-ink-muted-80">{description}</p>
          <Button variant="hero" className="mt-8" onClick={onOpenWalletModal}>
            Connect Wallet
          </Button>
          <p className="t-fine-print mt-6 text-ink-muted-48">
            Wallet required for giveaway participation and ZK proof generation.
          </p>
        </motion.div>
      </section>
    );
  }

  return <>{children}</>;
}
