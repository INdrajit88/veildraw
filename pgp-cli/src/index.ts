// Private Giveaway Platform (PGP) CLI Implementation

import { createInterface, type Interface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { WebSocket } from 'ws';
import {
  PGPAPI,
  type PGPDerivedState,
  pgpPrivateStateKey,
  type PGPProviders,
  type DeployedPGPContract,
  type PrivateStateId,
} from '../../api/src/index.js';
import { type WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { ledger, type Ledger, State } from '../../contract/src/managed/pgp/contract/index.js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { type Logger } from 'pino';
import { type Config, StandaloneConfig } from './config.js';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { assertIsContractAddress, toHex } from '@midnight-ntwrk/midnight-js-utils';
import { TestEnvironment } from '@midnight-ntwrk/testkit-js';
import { MidnightWalletProvider } from './midnight-wallet-provider.js';
import { randomBytes } from '../../api/src/utils/index.js';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { syncWallet, waitForUnshieldedFunds } from './wallet-utils.js';
import { generateDust } from './generate-dust.js';
import { PGPPrivateState } from '../../contract/src/witnesses.js';
import { firstValueFrom } from 'rxjs';

// @ts-expect-error: WebSocket global for apollo
globalThis.WebSocket = WebSocket;

export const getPGPLedgerState = async (
  providers: PGPProviders,
  contractAddress: ContractAddress,
): Promise<Ledger | null> => {
  assertIsContractAddress(contractAddress);
  const contractState = await providers.publicDataProvider.queryContractState(contractAddress);
  return contractState != null ? ledger(contractState.data) : null;
};

const DEPLOY_OR_JOIN_QUESTION = `
Private Giveaway Platform (PGP) - Main Menu:
  1. Deploy a new Giveaway contract
  2. Join an existing Giveaway contract
  3. Exit
Which would you like to do? `;

const deployOrJoin = async (providers: PGPProviders, rli: Interface, logger: Logger): Promise<PGPAPI | null> => {
  let api: PGPAPI | null = null;
  while (true) {
    const choice = await rli.question(DEPLOY_OR_JOIN_QUESTION);
    switch (choice) {
      case '1':
        api = await PGPAPI.deploy(providers, logger);
        logger.info(`Deployed PGP contract at address: ${api.deployedContractAddress}`);
        return api;
      case '2':
        api = await PGPAPI.join(providers, await rli.question('Enter PGP Contract address (hex): '), logger);
        logger.info(`Joined PGP contract at address: ${api.deployedContractAddress}`);
        return api;
      case '3':
        logger.info('Exiting...');
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

const MAIN_LOOP_QUESTION = `
Giveaway Operations:
  1. Create a new Giveaway (Organizer)
  2. Enter Giveaway (Participant - ZK Commitment)
  3. Close Entries & Select Winner (Organizer)
  4. Claim Prize (Winner ZK Verification)
  5. Display Current Ledger State
  6. Exit
Which action would you like to perform? `;

const mainLoop = async (providers: PGPProviders, rli: Interface, logger: Logger): Promise<void> => {
  const pgpApi = await deployOrJoin(providers, rli, logger);
  if (pgpApi === null) {
    return;
  }
  let currentState: PGPDerivedState | undefined;
  const subscription = pgpApi.state$.subscribe((state) => {
    currentState = state;
    logger.info(`State update received: GiveawayState=${State[state.giveawayState]}, Entries=${state.entryCount}`);
  });

  try {
    while (true) {
      const choice = await rli.question(MAIN_LOOP_QUESTION);
      try {
        switch (choice) {
          case '1': {
            const title = await rli.question('Enter Giveaway Title: ');
            const prize = await rli.question('Enter Prize Details: ');
            await pgpApi.createGiveaway(title, prize);
            logger.info('Giveaway successfully created on-chain!');
            break;
          }
          case '2': {
            const commitment = await rli.question('Enter 64-char Hex Entry Commitment: ');
            await pgpApi.enterGiveaway(commitment);
            logger.info('Private entry commitment submitted to ledger!');
            break;
          }
          case '3': {
            const winnerCommitment = await rli.question('Enter Winning Commitment Hex: ');
            await pgpApi.closeAndSelectWinner(winnerCommitment);
            logger.info('Entries closed and winning commitment posted!');
            break;
          }
          case '4': {
            const secret = await rli.question('Enter Winner Ticket Secret Hex: ');
            await pgpApi.claimPrize(secret);
            logger.info('Prize claimed via ZK proof verification!');
            break;
          }
          case '5': {
            if (currentState) {
              logger.info(`Current Title: ${currentState.title ?? 'None'}`);
              logger.info(`Prize: ${currentState.prizeDetails ?? 'None'}`);
              logger.info(`State: ${State[currentState.giveawayState]}`);
              logger.info(`Entries: ${currentState.entryCount}`);
              logger.info(`Winning Commitment: ${currentState.winningCommitment}`);
              logger.info(`Winner Claimed: ${currentState.winnerClaimed}`);
            } else {
              logger.info('No state data available yet');
            }
            break;
          }
          case '6':
            logger.info('Exiting PGP CLI...');
            return;
          default:
            logger.error(`Invalid choice: ${choice}`);
        }
      } catch (e) {
        if (e instanceof Error) {
          logger.error(`Error: ${e.message}`);
        }
      }
    }
  } finally {
    subscription.unsubscribe();
  }
};

const GENESIS_MINT_WALLET_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

const WALLET_LOOP_QUESTION = `
PGP Wallet Setup:
  1. Build a fresh wallet
  2. Build wallet from a seed
  3. Exit
Which would you like to do? `;

const buildWallet = async (config: Config, rli: Interface, logger: Logger): Promise<string | undefined> => {
  if (config instanceof StandaloneConfig) {
    return GENESIS_MINT_WALLET_SEED;
  }
  while (true) {
    const choice = await rli.question(WALLET_LOOP_QUESTION);
    switch (choice) {
      case '1':
        return toHex(randomBytes(32));
      case '2':
        return await rli.question('Enter your wallet seed: ');
      case '3':
        logger.info('Exiting...');
        return undefined;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

export const run = async (config: Config, testEnv: TestEnvironment, logger: Logger): Promise<void> => {
  const rli = createInterface({ input, output, terminal: true });
  const providersToBeStopped: MidnightWalletProvider[] = [];
  try {
    const envConfiguration = await testEnv.start();
    logger.info(`Environment started with configuration: ${JSON.stringify(envConfiguration)}`);
    const seed = await buildWallet(config, rli, logger);
    if (seed === undefined) {
      return;
    }
    const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, seed);
    providersToBeStopped.push(walletProvider);
    const walletFacade: WalletFacade = walletProvider.wallet;

    await walletProvider.start();

    // If an earlier run already registered dust, fees can be paid from dust
    // alone, so skip the NIGHT funds wait (registration consumes the UTXO).
    const preSyncState = await firstValueFrom(walletFacade.state());
    const existingDust = preSyncState.dust.balance(new Date());
    if (existingDust > 0n) {
      logger.info(`Existing dust balance is ${existingDust}; skipping wait for unshielded funds`);
    } else {
      const unshieldedState = await waitForUnshieldedFunds(logger, walletFacade, envConfiguration, unshieldedToken());
      const nightBalance = unshieldedState.balances[unshieldedToken().raw];
      if (nightBalance === undefined) {
        logger.info('No funds received, exiting...');
        return;
      }
      logger.info(`Your NIGHT wallet balance is: ${nightBalance}`);

      if (config.generateDust) {
        const dustGeneration = await generateDust(logger, seed, unshieldedState, walletFacade);
        if (dustGeneration) {
          logger.info(`Submitted dust generation registration transaction: ${dustGeneration}`);
          await syncWallet(logger, walletFacade);
        }
      }
    }

    const zkConfigProvider = new NodeZkConfigProvider<
      'createGiveaway' | 'enterGiveaway' | 'closeAndSelectWinner' | 'claimPrize' | 'cancelGiveaway'
    >(config.zkConfigPath);

    const providers: PGPProviders = {
      privateStateProvider: levelPrivateStateProvider<PrivateStateId, PGPPrivateState>({
        privateStateStoreName: config.privateStateStoreName,
        signingKeyStoreName: `${config.privateStateStoreName}-signing-keys`,
        privateStoragePasswordProvider: () => 'PGP-Test-Secret-Password-2026!',
        accountId: seed,
      }),
      publicDataProvider: indexerPublicDataProvider(envConfiguration.indexer, envConfiguration.indexerWS),
      zkConfigProvider: zkConfigProvider,
      proofProvider: httpClientProofProvider(envConfiguration.proofServer, zkConfigProvider),
      walletProvider: walletProvider,
      midnightProvider: walletProvider,
    };
    await mainLoop(providers, rli, logger);
  } catch (e) {
    if (e instanceof Error) {
      logger.error(`Error: ${e.message}`);
    }
  } finally {
    try {
      rli.close();
      rli.removeAllListeners();
    } catch (e) {
      // ignore
    } finally {
      try {
        for (const wallet of providersToBeStopped) {
          await wallet.stop();
        }
        if (testEnv) {
          await testEnv.shutdown();
        }
      } catch (e) {
        // ignore
      }
    }
  }
};
