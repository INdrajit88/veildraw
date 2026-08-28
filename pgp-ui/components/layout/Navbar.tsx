'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, X, Wallet } from 'lucide-react';
import { cn, formatAddress } from '@/lib/utils';
import type { WalletState } from '@/lib/types';
import { networkBadge } from '@/lib/network';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/giveaways', label: 'Giveaways' },
  { href: '/dashboard', label: 'Dashboard' },
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
  const reduceMotion = useReducedMotion();

  // Close the mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => (href === '/' ? normalizedPath === '/' : normalizedPath.startsWith(href));

  return (
    <header className="sticky top-0 z-40 w-full">
      <nav aria-label="Primary" className="frosted border-b border-white/[0.07]">
        <div className="mx-auto flex h-16 max-w-grid items-center justify-between gap-4 px-4 sm:px-6">
          {/* Brand */}
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="VeilDraw home">
            <span className="flex size-8 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-tile-2 transition-colors group-hover:border-white/20">
              <img src="/logo.png" alt="" className="h-5 w-5 object-contain" />
            </span>
            <span className="font-display text-[15px] font-semibold tracking-tight text-white">VeilDraw</span>
            <span className="hidden rounded-pill border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted-48 xl:inline">
              {networkBadge}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-0.5 lg:flex">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-pill px-3 py-1.5 t-nav-link transition-colors duration-200',
                    active
                      ? 'bg-white/[0.08] text-white'
                      : 'text-ink-muted-48 hover:bg-white/[0.04] hover:text-ink-muted-80',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2.5">
            {wallet.isConnected && wallet.address && (
              <button
                onClick={onOpenWalletModal}
                className="press hidden items-center gap-2 rounded-pill border border-white/10 bg-white/[0.04] px-3.5 py-1.5 font-mono text-xs text-ink-muted-80 transition-colors hover:border-white/20 hover:text-white lg:flex"
                aria-label={`Connected wallet ${formatAddress(wallet.address)} — manage`}
              >
                <span className="size-1.5 rounded-full bg-emerald" aria-hidden />
                {formatAddress(wallet.address)}
              </button>
            )}

            <button
              onClick={onOpenWalletModal}
              className={cn(
                'press hidden items-center gap-1.5 rounded-pill px-4 py-2 t-button-utility transition-all duration-200 lg:flex',
                wallet.isConnected
                  ? 'border border-white/10 bg-chip/70 text-white hover:bg-chip'
                  : 'bg-primary text-white hover:bg-primary-bright hover:shadow-glow-primary',
              )}
            >
              <Wallet className="size-3.5" aria-hidden />
              {wallet.isConnected ? 'Wallet' : 'Connect Wallet'}
            </button>

            {/* Mobile toggle */}
            <button
              className="press -mr-1 rounded-md p-2 text-ink-muted-80 hover:bg-white/5 hover:text-white lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={reduceMotion ? undefined : { height: 'auto', opacity: 1 }}
              exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-white/[0.07] bg-canvas/95 backdrop-blur-xl lg:hidden"
            >
              <div className="flex flex-col gap-1 px-4 py-4">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'rounded-md px-3 py-2.5 text-sm transition-colors',
                        active
                          ? 'bg-white/[0.08] font-semibold text-white'
                          : 'text-ink-muted-80 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenWalletModal();
                  }}
                  className={cn(
                    'press mt-2 w-full rounded-pill px-4 py-3 t-button-utility',
                    wallet.isConnected ? 'border border-white/10 bg-chip/70 text-white' : 'bg-primary text-white',
                  )}
                >
                  {wallet.isConnected ? 'Manage Wallet' : 'Connect Midnight Wallet'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
