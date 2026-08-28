import type { Metadata } from 'next';
import { AnalyticsRoute } from '@/components/routes/AnalyticsRoute';

export const metadata: Metadata = {
  title: 'Analytics',
  description:
    'Live cryptographic telemetry for the VeilDraw contract — entry accumulator, winning commitment, and organizer key, streamed from the Midnight indexer.',
};

export default function AnalyticsPage() {
  return <AnalyticsRoute />;
}
