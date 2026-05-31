/**
 * Provably-fair RNG: commit-reveal over (serverSeed, clientSeed, nonce).
 * The serverSeed hash is published before play; the seed is revealed after,
 * so a player can verify the outcome was not manipulated.
 */
export const PROVABLY_FAIR_SERVICE = Symbol('PROVABLY_FAIR_SERVICE');

export interface SeedCommitment {
  /** sha256(serverSeed) — published before the round. */
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export interface RevealedSeed {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export interface IProvablyFairService {
  /** Produce a float in [0, 1) deterministically from the seeds. */
  outcome(commitment: SeedCommitment): number;
  /** Re-derive and check that serverSeed matches its published hash + outcome. */
  verify(revealed: RevealedSeed, claimedOutcome: number): boolean;
}
