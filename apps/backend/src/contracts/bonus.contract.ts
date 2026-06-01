import type { PlayerId } from '@casino/contracts';
import type { Result } from '@/shared/result';
import type { DomainError } from '@/shared/errors/domain-error';
import type { BonusProfile } from './data-providers/bonus-data-provider.contract';

/** DI token — inject across modules via @Inject(BONUS_SERVICE). */
export const BONUS_SERVICE = Symbol('BONUS_SERVICE');

export interface BonusStatus {
  freeSpins: number;
  dailyStreak: number;
  /** Whether the daily reward can be claimed right now. */
  canClaimDaily: boolean;
  /** Ms until the next daily claim is available (0 if claimable now). */
  nextDailyInMs: number;
}

export interface IBonusService {
  /** Current bonus status for a player (free spins + daily availability). */
  status(playerId: PlayerId): Promise<BonusStatus>;

  /** Claim the daily reward; errors if still on cooldown. */
  claimDaily(playerId: PlayerId): Promise<Result<BonusStatus, DomainError>>;

  /** Grant free spins (used by games on a scatter trigger). */
  grantFreeSpins(playerId: PlayerId, amount: number): Promise<BonusProfile>;

  /** Atomically use one free spin; true if one was available. */
  useFreeSpin(playerId: PlayerId): Promise<boolean>;
}
