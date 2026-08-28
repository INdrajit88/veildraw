'use client';

import { useStore } from '@/components/layout/ClientProviders';
import { SettingsView } from '@/components/views/SettingsView';

export function SettingsRoute() {
  const store = useStore();
  return (
    <SettingsView
      contractAddress={store.contractAddress}
      setContractAddress={store.setContractAddress}
      wallet={store.wallet}
    />
  );
}
