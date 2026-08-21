'use client';

import { useStore } from '@/components/layout/ClientProviders';
import { Dashboard } from '@/components/views/Dashboard';

export default function DashboardPage() {
  const store = useStore();
  return (
    <Dashboard giveaway={store.giveaway} activities={store.activities} indexerConnected={store.indexerConnected} />
  );
}
