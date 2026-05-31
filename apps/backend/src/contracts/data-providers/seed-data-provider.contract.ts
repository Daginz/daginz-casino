import type { PlayerId } from '@casino/contracts';

/** Persistence port for provably-fair seed pairs. */
export const SEED_DATA_PROVIDER = Symbol('SEED_DATA_PROVIDER');

export interface SeedPair {
  id: string;
  playerId: PlayerId;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  status: 'active' | 'revealed';
}

export interface ISeedDataProvider {
  /** The player's active seed pair, or null if none yet. */
  findActive(playerId: PlayerId): Promise<SeedPair | null>;
  /** Insert a new active seed pair (caller ensures none active exists). */
  createActive(input: {
    playerId: PlayerId;
    serverSeed: string;
    serverSeedHash: string;
    clientSeed: string;
  }): Promise<SeedPair>;
  /**
   * Atomically read the active seed's current nonce and increment it,
   * returning the value that was current BEFORE the increment.
   */
  drawNonce(playerId: PlayerId): Promise<SeedPair | null>;
  /** Mark the active seed revealed; returns the revealed pair. */
  revealActive(playerId: PlayerId): Promise<SeedPair | null>;
}
