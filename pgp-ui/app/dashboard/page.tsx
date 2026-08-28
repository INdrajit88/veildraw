import type { Metadata } from 'next';
import { DashboardRoute } from '@/components/routes/DashboardRoute';

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'Real-time control center for the active VeilDraw contract — live giveaway state, private entry count, and session activity on Midnight.',
};

export default function DashboardPage() {
  return <DashboardRoute />;
}
