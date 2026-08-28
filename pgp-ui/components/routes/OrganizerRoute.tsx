'use client';

import { useStore } from '@/components/layout/ClientProviders';
import { WalletGate } from '@/components/shared/WalletGate';
import { OrganizerConsole } from '@/components/views/OrganizerConsole';

export function OrganizerRoute() {
  const store = useStore();
  return (
    <WalletGate
      wallet={store.wallet}
      onOpenWalletModal={() => store.setIsWalletModalOpen(true)}
      title="Organizer Access Required"
      description="Connect your wallet to deploy giveaways and manage draws with organizer-bound circuits."
    >
      <OrganizerConsole
        giveaway={store.giveaway}
        createGiveawayAction={store.createGiveawayAction}
        closeAndSelectWinnerAction={store.closeAndSelectWinnerAction}
        cancelGiveawayAction={store.cancelGiveawayAction}
        contractAddress={store.contractAddress}
        indexerConnected={store.indexerConnected}
        setGiveaway={store.setGiveaway}
      />
    </WalletGate>
  );
}
