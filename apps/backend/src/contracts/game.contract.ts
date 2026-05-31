import type { GameRoundId, PlayerId } from '@casino/contracts';
import type { Result } from '@/shared/result';
import type { DomainError } from '@/shared/errors/domain-error';

/** Orchestrates a game round: stake → provably-fair outcome → payout → ledger. */
export const GAME_SERVICE = Symbol('GAME_SERVICE');

export type GameType = 'dice' | 'crash' | 'slot';

export interface PlaceBetInput {
  playerId: PlayerId;
  game: GameType;
  amount: bigint;
  clientSeed: string;
  /** Game-specific params, e.g. dice target. Validated per-game. */
  params: Record<string, number>;
}

export interface GameRound {
  id: GameRoundId;
  playerId: PlayerId;
  game: GameType;
  amount: bigint;
  outcome: number;
  payout: bigint;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  createdAt: Date;
}

export interface IGameService {
  placeBet(input: PlaceBetInput): Promise<Result<GameRound, DomainError>>;
  getRound(id: GameRoundId): Promise<Result<GameRound, DomainError>>;
}
