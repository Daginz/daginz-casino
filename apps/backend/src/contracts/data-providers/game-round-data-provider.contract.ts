import type { GameRoundId, PlayerId } from '@casino/contracts';

/** Persistence port for completed game rounds (history). */
export const GAME_ROUND_DATA_PROVIDER = Symbol('GAME_ROUND_DATA_PROVIDER');

export interface StoredRound {
  id: GameRoundId;
  playerId: PlayerId;
  game: string;
  stake: bigint;
  payout: bigint;
  outcome: number;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  detail: unknown;
  createdAt: Date;
}

export interface IGameRoundDataProvider {
  save(round: Omit<StoredRound, 'id' | 'createdAt'>): Promise<StoredRound>;
  findById(id: GameRoundId): Promise<StoredRound | null>;
  listByPlayer(playerId: PlayerId, limit: number): Promise<StoredRound[]>;
}
