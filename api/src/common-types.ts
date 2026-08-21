// Private Giveaway Platform (PGP) Common Types

import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { State, PGPPrivateState, Contract, Witnesses } from '../../contract/src/index.js';

export const pgpPrivateStateKey = 'pgpPrivateState';
export type PrivateStateId = typeof pgpPrivateStateKey;

export type PrivateStates = {
  readonly pgpPrivateState: PGPPrivateState;
};

export type PGPContract = Contract<PGPPrivateState, Witnesses<PGPPrivateState>>;

export type PGPCircuitKeys = Exclude<keyof PGPContract['impureCircuits'], number | symbol>;

export type PGPProviders = MidnightProviders<PGPCircuitKeys, PrivateStateId, PGPPrivateState>;

export type DeployedPGPContract = FoundContract<PGPContract>;

export type PGPDerivedState = {
  readonly giveawayState: State;
  readonly title: string | undefined;
  readonly prizeDetails: string | undefined;
  readonly organizerPk: string;
  readonly entryCount: bigint;
  readonly entryAccumulator: string;
  readonly winningCommitment: string;
  readonly winnerClaimed: boolean;
  readonly isOrganizer: boolean;
};

export type TransactionLifecycleStatus = 'Pending' | 'Processing' | 'Confirmed' | 'Failed';

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  circuit: string;
  status: TransactionLifecycleStatus;
  txHash?: string;
  details: string;
}
