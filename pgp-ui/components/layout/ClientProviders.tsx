'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WalletModal } from '@/components/modals/WalletModal';
import { TransactionModal } from '@/components/modals/TransactionModal';
import { usePGPStore } from '@/lib/store';
import { pageTransition, ease } from '@/lib/motion';

// Store context — shared across all pages via useStore()
export type StoreValue = ReturnType<typeof usePGPStore>;
const DEFAULT_STORE: StoreValue = {
  contractAddress: '445563f8b0fa114ba33cde6a66f6de928de1f2a7bbe55a89ab4033d0b4dfe4b1',
  setContractAddress: () => {},
  giveaway: {
    id: 'pgp-giveaway-1',
    contractAddress: '445563f8b0fa114ba33cde6a66f6de928de1f2a7bbe55a89ab4033d0b4dfe4b1',
    title: 'VeilDraw Preview Giveaway',
    prizeDetails: '5,000 tNIGHT + Private Pass',
    organizerPk: '',
    state: 'REGISTRATION_OPEN',
    entryCount: 0,
    entryAccumulator: '',
    winningCommitment: '',
    winnerClaimed: false,
    isOrganizer: false,
  },
  setGiveaway: () => {},
  activities: [],
  addActivity: () => {},
  indexerConnected: false,
  wallet: {
    isConnected: false,
    address: null,
    network: 'Midnight Preview',
    balance: '--',
    walletType: null,
    isLaceInstalled: false,
    isConnecting: false,
    error: null,
  },
  setWallet: () => {},
  isWalletModalOpen: false,
  setIsWalletModalOpen: () => {},
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  toggleWalletConnection: async () => {},
  txModal: {
    isOpen: false,
    status: 'Idle',
    action: '',
    message: '',
  },

  setTxModal: () => {},
  enterGiveawayAction: async () => {},
  claimPrizeAction: async () => {},
  createGiveawayAction: async () => {},
  closeAndSelectWinnerAction: async () => {},
  cancelGiveawayAction: async () => {},
  subscribeContract: () => {},
};

const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  return ctx || DEFAULT_STORE;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const store = usePGPStore();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

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

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <StoreContext.Provider value={store}>
      <div className="flex min-h-screen flex-col bg-canvas">
        <Navbar wallet={store.wallet} onOpenWalletModal={() => store.setIsWalletModalOpen(true)} />

        <main className="flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              variants={reduceMotion ? undefined : pageTransition}
              initial={reduceMotion ? false : 'initial'}
              animate="animate"
              exit={reduceMotion ? undefined : 'exit'}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.25, ease }}
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

        <Toaster position="bottom-right" theme="dark" richColors />
      </div>
    </StoreContext.Provider>
  );
}
