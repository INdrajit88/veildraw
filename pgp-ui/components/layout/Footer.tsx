'use client';

import React from 'react';
import Link from 'next/link';
import { indexerUrl, networkCapitalized } from '@/lib/network';

const columns = [
  {
    heading: 'Protocol',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Enter Giveaway', href: '/giveaways' },
      { label: 'Verify & Claim', href: '/verify' },
      { label: 'Organizer Console', href: '/organizer' },
    ],
  },
  {
    heading: 'Network',
    links: [
      { label: 'Analytics', href: '/analytics' },
      { label: 'Settings', href: '/settings' },
      { label: `${networkCapitalized} Indexer`, href: indexerUrl },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-parchment">
      <div className="mx-auto max-w-grid px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <img src="/icon.svg" alt="" className="h-6 w-6" />
              <span className="t-tagline text-ink">VeilDraw</span>
            </div>
            <p className="mt-4 max-w-xs t-caption text-ink-muted-48">
              VeilDraw — cryptographically proven giveaways, on-chain and anonymous.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="t-caption-strong text-ink">{col.heading}</h3>
              <ul className="mt-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="t-dense-link text-primary hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-hairline pt-6">
          <p className="t-fine-print text-ink-muted-48">
            © 2026 VeilDraw. Privacy-preserving by design — entries, tickets, and identities never leave your device in
            the clear.
          </p>
        </div>
      </div>
    </footer>
  );
}
