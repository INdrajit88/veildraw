'use client';

import { useStore } from '@/components/layout/ClientProviders';
import { HomePage } from '@/components/views/HomePage';

export default function Home() {
  const store = useStore();
  return (
    <HomePage
      giveaway={store.giveaway}
      wallet={store.wallet}
      onOpenWalletModal={() => store.setIsWalletModalOpen(true)}
    />
  );
}
