import type { Metadata } from 'next';
import { GiveawaysRoute } from '@/components/routes/GiveawaysRoute';

export const metadata: Metadata = {
  title: 'Giveaways',
  description:
    'Enter a private VeilDraw giveaway on Midnight. Derive a ZK commitment locally and publish only the opaque hash — no address, no entry list.',
};

export default function GiveawaysPage() {
  return <GiveawaysRoute />;
}
