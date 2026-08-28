import type { Metadata } from 'next';
import { SettingsRoute } from '@/components/routes/SettingsRoute';

export const metadata: Metadata = {
  title: 'Settings',
  description:
    'Configure the active VeilDraw contract address, inspect Midnight network endpoints, and review your wallet session.',
};

export default function SettingsPage() {
  return <SettingsRoute />;
}
