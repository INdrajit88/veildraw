'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn, formatAddress } from '@/lib/utils';
import type { WalletState } from '@/lib/types';
import { networkBadge } from '@/lib/network';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/giveaways', label: 'Giveaways' },
  { href: '/verify', label: 'Verify' },
  { href: '/organizer', label: 'Organizer' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/settings', label: 'Settings' },
];

interface NavbarProps {
  wallet: WalletState;
  onOpenWalletModal: () => void;
}

export function Navbar({ wallet, onOpenWalletModal }: NavbarProps) {
  const pathname = usePathname();
  const normalizedPath = pathname?.replace(/\/$/, '') || '/';
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = navItems.find((i) => (i.href === '/' ? normalizedPath === '/' : normalizedPath.startsWith(i.href)));

  return (
    <header className="sticky top-0 z-40">
      {/* global-nav — true black, 44px, quiet 12px links */}
      <nav className="bg-surface-black">
        <div className="mx-auto flex h-11 max-w-grid items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="" className="h-5 w-5" />
            <span className="t-nav-link font-semibold text-white">VeilDraw</span>
          </Link>

          <div className="hidden items-center gap-5 lg:flex">
            {navItems.map((item) => {
              const active = item.href === '/' ? normalizedPath === '/' : normalizedPath.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    't-nav-link transition-opacity',
                    active ? 'text-white opacity-100' : 'text-white/80 opacity-80 hover:opacity-100',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {wallet.isConnected && wallet.address ? (
              <button
                onClick={onOpenWalletModal}
                className="press hidden rounded-sm bg-ink px-[15px] py-2 t-button-utility text-white lg:block"
              >
                {formatAddress(wallet.address)}
              </button>
            ) : null}
            <button
              onClick={onOpenWalletModal}
              className="press hidden rounded-pill bg-primary px-4 py-1.5 t-button-utility text-white lg:block"
            >
              {wallet.isConnected ? 'Wallet' : 'Connect Wallet'}
            </button>
            <button
              className="press text-white/80 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* mobile tray */}
        {mobileOpen && (
          <div className="border-t border-white/10 px-6 py-4 lg:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    't-button-utility',
                    normalizedPath.startsWith(item.href === '/' ? '/' : item.href) ? 'text-white' : 'text-white/70',
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onOpenWalletModal();
                }}
                className="press mt-2 w-fit rounded-pill bg-primary px-4 py-1.5 t-button-utility text-white"
              >
                {wallet.isConnected ? 'Wallet' : 'Connect Wallet'}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* sub-nav-frosted — section name left, network status right */}
      <div className="frosted border-b border-black/5">
        <div className="mx-auto flex h-[52px] max-w-grid items-center justify-between px-6">
          <span className="t-tagline text-ink">{current?.label ?? 'VeilDraw'}</span>
          <span className="t-button-utility text-ink-muted-48">{networkBadge} · Zero-Knowledge Proofs</span>
        </div>
      </div>
    </header>
  );
}
