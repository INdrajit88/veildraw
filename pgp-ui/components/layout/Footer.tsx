'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ExternalLink } from 'lucide-react';
import { indexerUrl, rpcNodeUrl, networkCapitalized } from '@/lib/network';

const columns: {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}[] = [
  {
    heading: 'Platform',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Giveaways', href: '/giveaways' },
      { label: 'Verify & Claim', href: '/verify' },
      { label: 'Organizer Console', href: '/organizer' },
    ],
  },
  {
    heading: 'Network',
    links: [
      { label: `${networkCapitalized} Indexer`, href: indexerUrl, external: true },
      { label: `${networkCapitalized} RPC Node`, href: rpcNodeUrl, external: true },
      { label: 'Protocol Analytics', href: '/analytics' },
      { label: 'Configuration', href: '/settings' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'X (Twitter)', href: 'https://x.com/VeilDraww', external: true },
      { label: 'Midnight Docs', href: 'https://docs.midnight.network', external: true },
      { label: 'Source on GitHub', href: 'https://github.com/INdrajit88/veildraw', external: true },
      { label: 'Live Deployment', href: 'https://veildraw-pgp-ui.vercel.app', external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-surface-black px-6 py-14">
      <div className="mx-auto max-w-grid">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-tile-2">
                <img src="/logo.png" alt="" className="h-5 w-5 object-contain" />
              </span>
              <span className="font-display text-base font-semibold tracking-tight text-white">VeilDraw</span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-ink-muted-48">
              Privacy-preserving giveaways on Midnight. Enter with an opaque commitment, prove eligibility in zero
              knowledge, and claim prizes — without ever publishing an entry list.
            </p>
            <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted-48">
              <Shield className="size-3 text-primary" aria-hidden />
              Compact ZK Contract · {networkCapitalized}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted-80">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted-48 transition-colors hover:text-white"
                      >
                        <span>{l.label}</span>
                        <ExternalLink className="size-3" aria-hidden />
                      </a>
                    ) : (
                      <Link href={l.href} className="text-[13px] text-ink-muted-48 transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-6 font-mono text-[11px] text-ink-muted-48">
          <p>© 2026 VeilDraw · Zero-knowledge giveaway protocol</p>
          <p>
            Built on <span className="text-ink-muted-80">Midnight</span> · ZK proofs via Compact
          </p>
        </div>
      </div>
    </footer>
  );
}
