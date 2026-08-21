import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum State { REGISTRATION_OPEN = 0,
                    DRAW_PENDING = 1,
                    COMPLETED = 2,
                    CANCELLED = 3
}

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  createGiveaway(context: __compactRuntime.CircuitContext<PS>,
                 newTitle_0: string,
                 newPrize_0: string): __compactRuntime.CircuitResults<PS, []>;
  enterGiveaway(context: __compactRuntime.CircuitContext<PS>,
                entryCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  closeAndSelectWinner(context: __compactRuntime.CircuitContext<PS>,
                       winnerCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimPrize(context: __compactRuntime.CircuitContext<PS>,
             ticketSecret_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  cancelGiveaway(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  createGiveaway(context: __compactRuntime.CircuitContext<PS>,
                 newTitle_0: string,
                 newPrize_0: string): __compactRuntime.CircuitResults<PS, []>;
  enterGiveaway(context: __compactRuntime.CircuitContext<PS>,
                entryCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  closeAndSelectWinner(context: __compactRuntime.CircuitContext<PS>,
                       winnerCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimPrize(context: __compactRuntime.CircuitContext<PS>,
             ticketSecret_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  cancelGiveaway(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  publicKey(sk_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  createGiveaway(context: __compactRuntime.CircuitContext<PS>,
                 newTitle_0: string,
                 newPrize_0: string): __compactRuntime.CircuitResults<PS, []>;
  enterGiveaway(context: __compactRuntime.CircuitContext<PS>,
                entryCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  closeAndSelectWinner(context: __compactRuntime.CircuitContext<PS>,
                       winnerCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimPrize(context: __compactRuntime.CircuitContext<PS>,
             ticketSecret_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  cancelGiveaway(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  publicKey(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly giveawayState: State;
  readonly title: { is_some: boolean, value: string };
  readonly prizeDetails: { is_some: boolean, value: string };
  readonly organizerPk: Uint8Array;
  readonly entryCount: bigint;
  readonly entryAccumulator: Uint8Array;
  readonly winningCommitment: Uint8Array;
  readonly winnerClaimed: boolean;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
