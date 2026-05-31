import type { PlayerId } from '@casino/contracts';
import type { Result } from '@/shared/result';
import type { DomainError } from '@/shared/errors/domain-error';

/**
 * Provably-fair RNG: commit-reveal over (serverSeed, clientSeed, nonce).
 * The serverSeed hash is published before play; the seed is revealed after
 * rotation, so a player can verify every outcome was not manipulated.
 * This is the shared fairness primitive for ALL games.
 */
export const PROVABLY_FAIR_SERVICE = Symbol('PROVABLY_FAIR_SERVICE');

/** Public info a player can see before betting (server seed stays hidden). */
export interface ActiveCommitment {
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

/** A single outcome draw bound to a specific seed pair + nonce. */
export interface FairDraw {
  /** Float in [0, 1) derived from HMAC(serverSeed, `${clientSeed}:${nonce}`). */
  outcome: number;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

/** Everything needed to independently verify a past outcome. */
export interface RevealedSeed {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export interface IProvablyFairService {
  /** Get (or lazily create) the player's active commitment — hash only. */
  getActiveCommitment(playerId: PlayerId): Promise<ActiveCommitment>;
  /**
   * Draw the next outcome for a player: reads active seed, computes the
   * outcome at the current nonce, then increments the nonce. Atomic.
   */
  draw(playerId: PlayerId): Promise<Result<FairDraw, DomainError>>;
  /** Let a player set their own client seed (rotates to a fresh server seed). */
  rotate(playerId: PlayerId, clientSeed: string): Promise<ActiveCommitment>;
  /** Reveal the current server seed (retires it) so the player can verify. */
  reveal(playerId: PlayerId): Promise<Result<RevealedSeed, DomainError>>;
  /** Pure check: re-derive outcome from a revealed seed and compare. */
  verify(revealed: RevealedSeed, claimedOutcome: number): boolean;
}
