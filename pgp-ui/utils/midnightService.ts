// Browser-compatible Midnight Service Layer
// Reads on-chain state via the network indexer; write operations require the CLI.
// Ported from src/utils/midnightService.ts — VITE_* → NEXT_PUBLIC_*

import { type Observable, EMPTY, BehaviorSubject, tap, map, catchError } from 'rxjs';
import { type State, ledger } from '@/lib/compact/pgp-contract';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import type { ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { indexerUrl, indexerWsUrl, cliCommand } from '@/lib/network';

export const NETWORK_INDEXER = indexerUrl;
export const NETWORK_INDEXER_WS = indexerWsUrl;
export const LOCAL_PROOF_SERVER = 'http://localhost:6300';

export type GiveawayStateName = 'REGISTRATION_OPEN' | 'DRAW_PENDING' | 'COMPLETED' | 'CANCELLED';

export interface PGPDerivedState {
  readonly giveawayState: State;
  readonly title: string | undefined;
  readonly prizeDetails: string | undefined;
  readonly organizerPk: string;
  readonly entryCount: bigint;
  readonly entryAccumulator: string;
  readonly winningCommitment: string;
  readonly winnerClaimed: boolean;
  readonly isOrganizer: boolean;
}

export interface MidnightConnectionStatus {
  readonly indexerConnected: boolean;
  readonly contractFound: boolean;
  readonly contractAddress: string;
  readonly error?: string;
}

const connection$ = new BehaviorSubject<MidnightConnectionStatus>({
  indexerConnected: false,
  contractFound: false,
  contractAddress: '',
});

export function getConnectionState(): MidnightConnectionStatus {
  return connection$.getValue();
}

function createState$(contractAddress: ContractAddress): Observable<PGPDerivedState> {
  const publicDataProvider = indexerPublicDataProvider(NETWORK_INDEXER, NETWORK_INDEXER_WS);

  return publicDataProvider.contractStateObservable(contractAddress, { type: 'latest' }).pipe(
    map((contractState) => ledger(contractState.data)),
    map((ledgerState) => ({
      giveawayState: ledgerState.giveawayState,
      title: ledgerState.title?.value,
      prizeDetails: ledgerState.prizeDetails?.value,
      organizerPk: toHex(ledgerState.organizerPk),
      entryCount: ledgerState.entryCount,
      entryAccumulator: toHex(ledgerState.entryAccumulator),
      winningCommitment: toHex(ledgerState.winningCommitment),
      winnerClaimed: ledgerState.winnerClaimed,
      isOrganizer: false,
    })),
  );
}

export function connectContract(contractAddress: string): Observable<PGPDerivedState> {
  const cleanAddress = contractAddress.replace(/^0x/, '');
  if (!cleanAddress || cleanAddress.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(cleanAddress)) {
    connection$.next({
      indexerConnected: false,
      contractFound: false,
      contractAddress: cleanAddress,
      error: 'Contract address must be a 64-character hex string',
    });
    return EMPTY;
  }

  const address = `0x${cleanAddress}`;
  connection$.next({ indexerConnected: true, contractFound: false, contractAddress: cleanAddress });

  return createState$(address).pipe(
    tap(() => {
      connection$.next({ indexerConnected: true, contractFound: true, contractAddress: cleanAddress });
    }),
    catchError((err) => {
      connection$.next({
        indexerConnected: true,
        contractFound: false,
        contractAddress: cleanAddress,
        error: `Failed to observe contract: ${err?.message ?? 'unknown error'}`,
      });
      return EMPTY;
    }),
  );
}

export function disconnectContract(): void {
  connection$.next({ indexerConnected: false, contractFound: false, contractAddress: '' });
}

const CLI_MESSAGE =
  'Circuit calls from the browser require the Midnight Lace wallet extension and a proof server at localhost:6300. ' +
  `Use the CLI to submit transactions: \`${cliCommand}\`.`;

export async function enterGiveaway(_contractAddress: string, _commitmentHex: string): Promise<void> {
  throw new Error(CLI_MESSAGE);
}

export async function claimPrize(_contractAddress: string, _ticketSecretHex: string): Promise<void> {
  throw new Error(CLI_MESSAGE);
}

export async function createGiveaway(_contractAddress: string, _title: string, _prizeDetails: string): Promise<void> {
  throw new Error(CLI_MESSAGE);
}

export async function closeAndSelectWinner(_contractAddress: string, _winningCommitment: string): Promise<void> {
  throw new Error(CLI_MESSAGE);
}

export async function cancelGiveaway(_contractAddress: string): Promise<void> {
  throw new Error(CLI_MESSAGE);
}
