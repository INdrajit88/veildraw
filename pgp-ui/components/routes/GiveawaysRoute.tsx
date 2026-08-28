'use client';

import { useStore } from '@/components/layout/ClientProviders';
import { WalletGate } from '@/components/shared/WalletGate';
import { GiveawayPortal } from '@/components/views/GiveawayPortal';

export function GiveawaysRoute() {
  const store = useStore();
  return (
    <WalletGate
      wallet={store.wallet}
      onOpenWalletModal={() => store.setIsWalletModalOpen(true)}
      title="Participant Access Required"
      description="Connect your wallet to enter giveaways and submit your private entry commitment."
    >
      <GiveawayPortal
        giveaway={store.giveaway}
        enterGiveawayAction={store.enterGiveawayAction}
        contractAddress={store.contractAddress}
        indexerConnected={store.indexerConnected}
        setGiveaway={store.setGiveaway}
      />
    </WalletGate>
  );
}
