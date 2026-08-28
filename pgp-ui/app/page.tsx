import type { Metadata } from 'next';
import { HomeRoute } from '@/components/routes/HomeRoute';

export const metadata: Metadata = {
  title: 'VeilDraw — Private Giveaways, Zero-Knowledge Proven',
  description:
    'VeilDraw runs zero-knowledge giveaways on Midnight. Enter with an opaque commitment, prove eligibility in zero knowledge, and claim prizes without revealing your identity.',
};

export default function Home() {
  return <HomeRoute />;
}
