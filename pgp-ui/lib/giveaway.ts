// Shared presentation helpers for giveaway state (no business logic)
import type { GiveawayItem } from '@/lib/types';

export type StateBadge = 'open' | 'pending' | 'completed' | 'cancelled';

export function stateBadgeVariant(state: GiveawayItem['state']): StateBadge {
  switch (state) {
    case 'REGISTRATION_OPEN':
      return 'open';
    case 'DRAW_PENDING':
      return 'pending';
    case 'COMPLETED':
      return 'completed';
    default:
      return 'cancelled';
  }
}

export function stateLabel(state: GiveawayItem['state']): string {
  switch (state) {
    case 'REGISTRATION_OPEN':
      return 'Registration open';
    case 'DRAW_PENDING':
      return 'Draw pending';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
  }
}
