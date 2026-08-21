'use client';
// PGP State Store — ported from src/store/useStore.ts
// Real indexer connection & honest transaction flow.

import { useState, useEffect, useRef } from 'react';
import type { Subscription } from 'rxjs';
import type { ActivityItem, GiveawayItem, WalletState, TransactionStatus } from './types';
import { detectMidnightWallets, connectMidnightWallet } from '@/utils/midnightWallet';
import { networkLabel } from './network';
import {
  connectContract,
  disconnectContract,
  enterGiveaway,
  claimPrize,
  createGiveaway,
  closeAndSelectWinner,
  cancelGiveaway,
} from '@/utils/midnightService';

const INITIAL_GIVEAWAY: GiveawayItem = {
  id: 'pgp-giveaway-1',
  contractAddress: '445563f8b0fa114ba33cde6a66f6de928de1f2a7bbe55a89ab4033d0b4dfe4b1',
  title: 'No contract connected',
  prizeDetails: 'Enter a deployed VeilDraw contract address to view on-chain state',
  organizerPk: '',
  state: 'REGISTRATION_OPEN',
  entryCount: 0,
  entryAccumulator: '',
  winningCommitment: '',
  winnerClaimed: false,
  isOrganizer: false,
};

export function usePGPStore() {
  const [contractAddress, setContractAddress] = useState<string>(
    '445563f8b0fa114ba33cde6a66f6de928de1f2a7bbe55a89ab4033d0b4dfe4b1',
  );
  const [giveaway, setGiveaway] = useState<GiveawayItem>(INITIAL_GIVEAWAY);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [indexerConnected, setIndexerConnected] = useState<boolean>(false);
  const stateSubscription = useRef<Subscription | null>(null);

  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    network: networkLabel,
    balance: '--',
    walletType: null,
    isLaceInstalled: false,
    isConnecting: false,
    error: null,
  });

  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);

  const [txModal, setTxModal] = useState<{
    isOpen: boolean;
    status: TransactionStatus;
    action: string;
    message: string;
    txHash?: string;
  }>({
    isOpen: false,
    status: 'Idle',
    action: '',
    message: '',
  });

  useEffect(() => {
    const { isLaceInstalled } = detectMidnightWallets();
    setWallet((prev) => ({ ...prev, isLaceInstalled }));
    return () => {
      stateSubscription.current?.unsubscribe();
    };
  }, []);

  const addActivity = (action: string, status: TransactionStatus, details: string, txHash?: string) => {
    setActivities((prev) => [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action,
        status,
        details,
        txHash,
      },
      ...prev.slice(0, 49), // keep last 50
    ]);
  };

  const subscribeContract = (address: string) => {
    stateSubscription.current?.unsubscribe();
    const state$ = connectContract(address);
    stateSubscription.current = state$.subscribe({
      next: (derived) => {
        setIndexerConnected(true);
        setGiveaway({
          id: address,
          contractAddress: address,
          title: derived.title ?? 'Untitled Giveaway',
          prizeDetails: derived.prizeDetails ?? 'Not set',
          organizerPk: derived.organizerPk,
          state: ['REGISTRATION_OPEN', 'DRAW_PENDING', 'COMPLETED', 'CANCELLED'][
            derived.giveawayState
          ] as GiveawayItem['state'],
          entryCount: Number(derived.entryCount ?? 0n),
          entryAccumulator: derived.entryAccumulator,
          winningCommitment: derived.winningCommitment,
          winnerClaimed: derived.winnerClaimed,
          isOrganizer: derived.isOrganizer,
        });
        addActivity('Contract Connected', 'Confirmed', `Bound to VeilDraw contract ${address.substring(0, 12)}…`);
      },
      error: () => {
        setIndexerConnected(false);
      },
    });
  };

  const handleSetContractAddress = (address: string) => {
    setContractAddress(address);
    if (address) {
      subscribeContract(address);
    } else {
      stateSubscription.current?.unsubscribe();
      disconnectContract();
      setIndexerConnected(false);
      setGiveaway(INITIAL_GIVEAWAY);
    }
  };

  const connectWallet = async (type: 'lace' | '1am' | 'seed' | 'custom', customAddress?: string) => {
    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));

    if (type === 'custom' && customAddress) {
      setWallet({
        isConnected: true,
        address: customAddress,
        network: networkLabel,
        balance: '--',
        walletType: 'custom',
        isLaceInstalled: wallet.isLaceInstalled,
        isConnecting: false,
        error: null,
      });
      setIsWalletModalOpen(false);
      addActivity('Wallet Connected', 'Confirmed', `View-only: ${customAddress.substring(0, 12)}…`);
      return;
    }

    try {
      const res = await connectMidnightWallet(type as 'lace' | '1am' | 'seed');
      setWallet({
        isConnected: true,
        address: res.address,
        network: res.network,
        balance: res.balance,
        walletType: type,
        isLaceInstalled: wallet.isLaceInstalled,
        isConnecting: false,
        error: null,
      });
      setIsWalletModalOpen(false);
      addActivity(
        'Wallet Connected',
        'Confirmed',
        `Connected via ${type.toUpperCase()} (${res.address.substring(0, 12)}…)`,
      );
    } catch (err) {
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error: err instanceof Error ? err.message : `Failed to connect ${type.toUpperCase()} wallet.`,
      }));
    }
  };

  const disconnectWallet = () => {
    setWallet((prev) => ({
      ...prev,
      isConnected: false,
      address: null,
      balance: '--',
      walletType: null,
      error: null,
    }));
    addActivity('Wallet Disconnected', 'Confirmed', 'Disconnected wallet');
    setIsWalletModalOpen(false);
  };

  const toggleWalletConnection = () => {
    if (wallet.isConnected) disconnectWallet();
    else setIsWalletModalOpen(true);
  };

  const submitCircuitCall = async (
    actionName: string,
    detailsText: string,
    onSuccess: () => void,
    circuitCall: () => Promise<void>,
  ) => {
    if (!wallet.isConnected) {
      setIsWalletModalOpen(true);
      return;
    }
    if (!contractAddress) {
      setTxModal({
        isOpen: true,
        status: 'Failed',
        action: actionName,
        message: 'No contract connected. Enter a deployed VeilDraw contract address in Settings first.',
      });
      return;
    }

    setTxModal({ isOpen: true, status: 'Pending', action: actionName, message: 'Generating ZK proof…' });

    try {
      await circuitCall();
      setTxModal({
        isOpen: true,
        status: 'Confirmed',
        action: actionName,
        message: 'Transaction confirmed on-chain.',
      });
      onSuccess();
      addActivity(actionName, 'Confirmed', detailsText);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Circuit call failed.';
      setTxModal({
        isOpen: true,
        status: 'Failed',
        action: actionName,
        message,
      });
      addActivity(actionName, 'Failed', message || detailsText);
    }
  };

  const enterGiveawayAction = (commitmentHex: string, onSuccess: () => void) =>
    submitCircuitCall('Private Entry', `Submitted ZK commitment ${commitmentHex.substring(0, 12)}…`, onSuccess, () =>
      enterGiveaway(contractAddress, commitmentHex),
    );

  const claimPrizeAction = (ticketSecretHex: string, onSuccess: () => void) =>
    submitCircuitCall('Prize Claim', 'ZK proof verifies ticket matches winning commitment', onSuccess, () =>
      claimPrize(contractAddress, ticketSecretHex),
    );

  const createGiveawayAction = (title: string, prizeDetails: string, onSuccess: () => void) =>
    submitCircuitCall('Create Giveaway', `Created giveaway "${title}"`, onSuccess, () =>
      createGiveaway(contractAddress, title, prizeDetails),
    );

  const closeAndSelectWinnerAction = (winningCommitment: string, onSuccess: () => void) =>
    submitCircuitCall(
      'Draw Winner',
      `Posted winning commitment ${winningCommitment.substring(0, 12)}…`,
      onSuccess,
      () => closeAndSelectWinner(contractAddress, winningCommitment),
    );

  const cancelGiveawayAction = (onSuccess: () => void) =>
    submitCircuitCall('Cancel Giveaway', 'Organizer cancelled the active giveaway', onSuccess, () =>
      cancelGiveaway(contractAddress),
    );

  return {
    contractAddress,
    setContractAddress: handleSetContractAddress,
    giveaway,
    setGiveaway,
    activities,
    addActivity,
    indexerConnected,
    wallet,
    setWallet,
    isWalletModalOpen,
    setIsWalletModalOpen,
    connectWallet,
    disconnectWallet,
    toggleWalletConnection,
    txModal,
    setTxModal,
    enterGiveawayAction,
    claimPrizeAction,
    createGiveawayAction,
    closeAndSelectWinnerAction,
    cancelGiveawayAction,
    subscribeContract,
  };
}
