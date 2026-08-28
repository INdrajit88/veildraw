import type { Metadata } from 'next';
import { OrganizerRoute } from '@/components/routes/OrganizerRoute';

export const metadata: Metadata = {
  title: 'Organizer Console',
  description:
    'Create VeilDraw giveaways, post the winning commitment, and manage the draw lifecycle — all guarded by organizer-bound ZK circuits on Midnight.',
};

export default function OrganizerPage() {
  return <OrganizerRoute />;
}
