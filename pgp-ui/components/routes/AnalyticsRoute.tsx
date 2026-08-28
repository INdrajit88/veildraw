'use client';

import { useStore } from '@/components/layout/ClientProviders';
import { AnalyticsView } from '@/components/views/AnalyticsView';

export function AnalyticsRoute() {
  const store = useStore();
  return <AnalyticsView giveaway={store.giveaway} indexerConnected={store.indexerConnected} />;
}
