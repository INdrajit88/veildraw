'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EyeOff, Menu, Wallet, X } from 'lucide-react';
import { cn, privateIdentity } from '@/lib/utils';
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

/**
 * Floating glass navigation.
 *
 * Stays `sticky` rather than `fixed` so it keeps occupying flow space and no
 * existing route needs extra top padding. The bar itself is a single translucent
 * pill; everything around it is transparent, so the immersive canvas reads
 * through on the home page without the chrome competing with it.
 */
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
      <nav aria-label="Primary" className="mx-auto mt-3 max-w-grid px-3 sm:px-6">
        <div className="veil-glass-strong veil-edge relative overflow-hidden rounded-lg">
          <div className="flex h-16 items-center justify-between gap-4 px-3 sm:px-5">
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
              {/* Connected identity, shown as a privacy-oriented representation
                  of the real address rather than the full string. */}
              {wallet.isConnected && wallet.address && (
                <button
                  onClick={onOpenWalletModal}
                  className="press hidden items-center gap-2.5 rounded-pill border border-white/[0.09] bg-white/[0.03] py-1.5 pl-3 pr-3.5 text-left transition-colors hover:border-violet/35 hover:bg-white/[0.06] lg:flex"
                  aria-label={`Connected as private identity ${privateIdentity(wallet.address)} — manage wallet`}
                >
                  <EyeOff className="size-3.5 shrink-0 text-violet" aria-hidden />
                  <span className="flex flex-col leading-none">
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted-48">
                      Private identity
                    </span>
                    <span className="tnum mt-1 font-mono text-[11px] text-white">
                      {privateIdentity(wallet.address)}
                    </span>
                  </span>
                  <span className="size-1.5 shrink-0 rounded-full bg-emerald" aria-hidden />
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
                className="overflow-hidden border-t border-white/[0.07] lg:hidden"
              >
                <div className="flex flex-col gap-1 px-3 py-4 sm:px-5">
                  {wallet.isConnected && wallet.address && (
                    <div className="mb-2 flex items-center gap-2.5 rounded-md border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 lg:hidden">
                      <EyeOff className="size-3.5 shrink-0 text-violet" aria-hidden />
                      <span className="flex flex-col leading-none">
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-muted-48">
                          Private identity
                        </span>
                        <span className="tnum mt-1 break-all font-mono text-[11px] text-white">
                          {privateIdentity(wallet.address)}
                        </span>
                      </span>
                    </div>
                  )}

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
        </div>
      </nav>
    </header>
  );
}
