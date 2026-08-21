// Private Giveaway Platform (PGP) API Implementation

import * as PGP from '../../contract/src/managed/pgp/contract/index.js';
import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type Logger } from 'pino';
import {
  type PGPDerivedState,
  type PGPContract,
  type PGPProviders,
  type DeployedPGPContract,
  pgpPrivateStateKey,
} from './common-types.js';
import { CompiledPGPContractContract } from '../../contract/src/index.js';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, map, tap, from, type Observable } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { PGPPrivateState, createPGPPrivateState } from '../../contract/src/witnesses.js';

export interface DeployedPGPAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<PGPDerivedState>;

  createGiveaway: (title: string, prizeDetails: string) => Promise<void>;
  enterGiveaway: (commitmentHex: string) => Promise<void>;
  closeAndSelectWinner: (winningCommitmentHex: string) => Promise<void>;
  claimPrize: (ticketSecretHex: string) => Promise<void>;
  cancelGiveaway: () => Promise<void>;
}

export class PGPAPI implements DeployedPGPAPI {
  private constructor(
    public readonly deployedContract: DeployedPGPContract,
    providers: PGPProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    providers.privateStateProvider.setContractAddress(this.deployedContractAddress);

    this.state$ = combineLatest(
      [
        providers.publicDataProvider.contractStateObservable(this.deployedContractAddress, { type: 'latest' }).pipe(
          map((contractState) => PGP.ledger(contractState.data)),
          tap((ledgerState) =>
            logger?.trace({
              pgpStateChanged: {
                giveawayState: ledgerState.giveawayState,
                entryCount: ledgerState.entryCount,
                winningCommitment: toHex(ledgerState.winningCommitment),
                winnerClaimed: ledgerState.winnerClaimed,
              },
            }),
          ),
        ),
        from(providers.privateStateProvider.get(pgpPrivateStateKey) as Promise<PGPPrivateState>),
      ],
      (ledgerState, privateState) => {
        const organizerPublicKey = PGP.pureCircuits.publicKey(privateState.secretKey);
        const isOrganizer = toHex(ledgerState.organizerPk) === toHex(organizerPublicKey);

        return {
          giveawayState: ledgerState.giveawayState,
          title: ledgerState.title.value,
          prizeDetails: ledgerState.prizeDetails.value,
          organizerPk: toHex(ledgerState.organizerPk),
          entryCount: ledgerState.entryCount,
          entryAccumulator: toHex(ledgerState.entryAccumulator),
          winningCommitment: toHex(ledgerState.winningCommitment),
          winnerClaimed: ledgerState.winnerClaimed,
          isOrganizer,
        };
      },
    );
  }

  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<PGPDerivedState>;

  async createGiveaway(title: string, prizeDetails: string): Promise<void> {
    this.logger?.info(`createGiveaway: title="${title}"`);
    const txData = await this.deployedContract.callTx.createGiveaway(title, prizeDetails);
    this.logger?.trace({
      transactionAdded: {
        circuit: 'createGiveaway',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  async enterGiveaway(commitmentHex: string): Promise<void> {
    this.logger?.info(`enterGiveaway: commitment="${commitmentHex}"`);
    const commitmentBytes = utils.hexToBytes(commitmentHex);
    const txData = await this.deployedContract.callTx.enterGiveaway(commitmentBytes);
    this.logger?.trace({
      transactionAdded: {
        circuit: 'enterGiveaway',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  async closeAndSelectWinner(winningCommitmentHex: string): Promise<void> {
    this.logger?.info(`closeAndSelectWinner: commitment="${winningCommitmentHex}"`);
    const winningBytes = utils.hexToBytes(winningCommitmentHex);
    const txData = await this.deployedContract.callTx.closeAndSelectWinner(winningBytes);
    this.logger?.trace({
      transactionAdded: {
        circuit: 'closeAndSelectWinner',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  async claimPrize(ticketSecretHex: string): Promise<void> {
    this.logger?.info(`claimPrize with ticketSecret`);
    const secretBytes = utils.hexToBytes(ticketSecretHex);
    const txData = await this.deployedContract.callTx.claimPrize(secretBytes);
    this.logger?.trace({
      transactionAdded: {
        circuit: 'claimPrize',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  async cancelGiveaway(): Promise<void> {
    this.logger?.info(`cancelGiveaway`);
    const txData = await this.deployedContract.callTx.cancelGiveaway();
    this.logger?.trace({
      transactionAdded: {
        circuit: 'cancelGiveaway',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  static async deploy(providers: PGPProviders, logger?: Logger): Promise<PGPAPI> {
    logger?.info('deployContract (PGP)');
    const deployedPGPContract = await deployContract(providers, {
      compiledContract: CompiledPGPContractContract,
      privateStateId: pgpPrivateStateKey,
      initialPrivateState: createPGPPrivateState(utils.randomBytes(32), utils.randomBytes(32)),
    });
    return new PGPAPI(deployedPGPContract, providers, logger);
  }

  static async join(providers: PGPProviders, contractAddress: ContractAddress, logger?: Logger): Promise<PGPAPI> {
    logger?.info({ joinContract: { contractAddress } });
    const deployedPGPContract = await findDeployedContract<PGPContract>(providers, {
      contractAddress,
      compiledContract: CompiledPGPContractContract,
      privateStateId: pgpPrivateStateKey,
      initialPrivateState: await PGPAPI.getPrivateState(providers, contractAddress),
    });
    return new PGPAPI(deployedPGPContract, providers, logger);
  }

  private static async getPrivateState(
    providers: PGPProviders,
    contractAddress: ContractAddress,
  ): Promise<PGPPrivateState> {
    providers.privateStateProvider.setContractAddress(contractAddress);
    const existing = await providers.privateStateProvider.get(pgpPrivateStateKey);
    return existing ?? createPGPPrivateState(utils.randomBytes(32), utils.randomBytes(32));
  }
}

export * as utils from './utils/index.js';
export * from './common-types.js';
