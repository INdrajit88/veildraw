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
