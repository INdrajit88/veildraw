// Export Private Giveaway Platform (PGP) Contract Bindings

import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";

export * from "./managed/pgp/contract/index.js";
export * from "./witnesses.js";

import * as CompiledPGPContract from "./managed/pgp/contract/index.js";
import * as Witnesses from "./witnesses.js";

export const CompiledPGPContractContract = CompiledContract.make<
  CompiledPGPContract.Contract<Witnesses.PGPPrivateState>
>("PGP", CompiledPGPContract.Contract<Witnesses.PGPPrivateState>).pipe(
  CompiledContract.withWitnesses(Witnesses.witnesses),
  CompiledContract.withCompiledFileAssets("./managed/pgp"),
);
