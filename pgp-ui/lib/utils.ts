import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Truncate a hex string for display: first N + "..." + last M chars */
export function truncateHex(hex: string, start = 8, end = 6): string {
  if (!hex || hex.length <= start + end + 3) return hex;
  return `${hex.slice(0, start)}…${hex.slice(-end)}`;
}

/** Format an address for display */
export function formatAddress(address: string | null, chars = 8): string {
  if (!address) return '—';
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}…${address.slice(-6)}`;
}

/**
 * Privacy-oriented short form of a real address.
 *
 * The leading and trailing characters are genuine and the middle is elided, so
 * this never invents a value — it just declines to show all of it. Case is
 * preserved because Midnight addresses are bech32m, where case is meaningful.
 */
export function privateIdentity(address: string | null, lead = 4, tail = 4): string {
  if (!address) return '—';
  if (address.length <= lead + tail + 4) return address;
  return `${address.slice(0, lead)}••••${address.slice(-tail)}`;
}
