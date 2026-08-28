'use client';

import { useStore } from '@/components/layout/ClientProviders';
import { WalletGate } from '@/components/shared/WalletGate';
import { WinnerVerification } from '@/components/views/WinnerVerification';

export function VerifyRoute() {
  const store = useStore();
  return (
    <WalletGate
      wallet={store.wallet}
      onOpenWalletModal={() => store.setIsWalletModalOpen(true)}
      title="Winner Access Required"
      description="Connect your wallet to verify the winning commitment and claim your prize privately."
    >
      <WinnerVerification
        giveaway={store.giveaway}
        claimPrizeAction={store.claimPrizeAction}
        contractAddress={store.contractAddress}
        indexerConnected={store.indexerConnected}
        setGiveaway={store.setGiveaway}
      />
    </WalletGate>
  );
}
