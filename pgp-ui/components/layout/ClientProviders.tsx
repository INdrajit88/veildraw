'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WalletModal } from '@/components/modals/WalletModal';
import { TransactionModal } from '@/components/modals/TransactionModal';
import { usePGPStore } from '@/lib/store';

// Store context — shared across all pages via useStore()
export type StoreValue = ReturnType<typeof usePGPStore>;
const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside ClientProviders');
  return ctx;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const store = usePGPStore();
  const pathname = usePathname();

  // Initialize polyfills + network ID on client mount
  useEffect(() => {
    // Buffer polyfill
    import('@/lib/globals').catch(() => {});

    // Network ID
    const networkId = process.env.NEXT_PUBLIC_NETWORK_ID || 'undeployed';
    import('@midnight-ntwrk/midnight-js-network-id')
      .then(({ setNetworkId }) => setNetworkId(networkId))
      .catch(() => {});
  }, []);

  return (
    <StoreContext.Provider value={store}>
      <div className="flex min-h-screen flex-col bg-canvas">
        <Navbar wallet={store.wallet} onOpenWalletModal={() => store.setIsWalletModalOpen(true)} />

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer />

        {/* Global modals */}
        <WalletModal
          isOpen={store.isWalletModalOpen}
          onClose={() => store.setIsWalletModalOpen(false)}
          wallet={store.wallet}
          connectWallet={store.connectWallet}
          disconnectWallet={store.disconnectWallet}
        />
        <TransactionModal
          isOpen={store.txModal.isOpen}
          status={store.txModal.status}
          action={store.txModal.action}
          message={store.txModal.message}
          txHash={store.txModal.txHash}
          onClose={() => store.setTxModal((prev) => ({ ...prev, isOpen: false }))}
        />

        <Toaster position="bottom-right" richColors />
      </div>
    </StoreContext.Provider>
  );
}
