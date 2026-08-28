'use client';

import { useStore } from '@/components/layout/ClientProviders';
import { HomePage } from '@/components/views/HomePage';

export function HomeRoute() {
  const store = useStore();
  return (
    <HomePage
      giveaway={store.giveaway}
      wallet={store.wallet}
      indexerConnected={store.indexerConnected}
      onOpenWalletModal={() => store.setIsWalletModalOpen(true)}
    />
  );
}
