// Witnesses for Private Giveaway Platform (PGP) Smart Contract

import { Ledger } from "./managed/pgp/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

export type PGPPrivateState = {
  readonly secretKey: Uint8Array;
  readonly participantNonce: Uint8Array;
};

export const createPGPPrivateState = (
  secretKey: Uint8Array,
  participantNonce: Uint8Array = new Uint8Array(32),
): PGPPrivateState => ({
  secretKey,
  participantNonce,
});

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, PGPPrivateState>): [
    PGPPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],

  participantNonce: ({
    privateState,
  }: WitnessContext<Ledger, PGPPrivateState>): [
    PGPPrivateState,
    Uint8Array,
  ] => [privateState, privateState.participantNonce],
};
