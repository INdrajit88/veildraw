'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { LiveGiveawayCard } from '@/components/views/LiveGiveawayCard';
import { RevealText, SectionReveal } from '@/components/motion/RevealText';
import { networkCapitalized } from '@/lib/network';
import type { GiveawayItem, WalletState } from '@/lib/types';

interface ExplorerSectionProps {
  giveaway: GiveawayItem;
  wallet: WalletState;
  onOpenWalletModal: () => void;
  indexerConnected: boolean;
}

/**
 * Act 04 · EXPLORER.
 *
 * The glass slabs floating in the scene behind this section are deliberately
 * blank: the contract holds a single active giveaway, so there is no collection
 * to browse and inventing one would mean inventing data. The one card rendered
 * here is the existing live-state component, reading the real indexer stream.
 */
export function ExplorerSection({ giveaway, wallet, onOpenWalletModal, indexerConnected }: ExplorerSectionProps) {
  return (
    <div className="relative mx-auto w-full max-w-content">
      <div className="veil-scrim pointer-events-none absolute -inset-x-14 -inset-y-10 hidden lg:block" aria-hidden />

      <div className="relative">
        <SectionReveal className="text-center">
          <p className="eyebrow justify-center">
            <Layers className="size-3.5" aria-hidden />
            Giveaway explorer
          </p>
          <RevealText
            as="h2"
            id="explorer-heading"
            lines={['One live draw.', 'Every field on-chain.']}
            className="t-section-immersive mt-5"
          />
          <p className="t-body mx-auto mt-5 max-w-xl">
            The VeilDraw contract holds a single active giveaway at a time, so there is no list to browse. Everything
            below is streamed from the {networkCapitalized} Midnight indexer — no simulated entries, no placeholder
            participants.
          </p>
        </SectionReveal>

        <div className="mt-10">
          <LiveGiveawayCard
            giveaway={giveaway}
            indexerConnected={indexerConnected}
            wallet={wallet}
            onOpenWalletModal={onOpenWalletModal}
          />
        </div>
      </div>
    </div>
  );
}
