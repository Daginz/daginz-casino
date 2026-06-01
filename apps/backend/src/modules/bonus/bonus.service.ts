import { Inject, Injectable } from '@nestjs/common';
import type { PlayerId } from '@casino/contracts';
import {
  BONUS_DATA_PROVIDER,
  type IBonusDataProvider,
  type BonusProfile,
} from '@/contracts/data-providers/bonus-data-provider.contract';
import type { BonusStatus, IBonusService } from '@/contracts/bonus.contract';
import { err, ok, type Result } from '@/shared/result';
import { ConflictError, type DomainError } from '@/shared/errors/domain-error';
import { env } from '@/config/env';

/**
 * Bonus economy: free-spin inventory + daily reward. Kept separate from the
 * ledger — a free spin is a promo, not real balance. The atomic cooldown /
 * decrement live in the data provider; this service shapes status + policy.
 */
@Injectable()
export class BonusService implements IBonusService {
  constructor(@Inject(BONUS_DATA_PROVIDER) private readonly bonuses: IBonusDataProvider) {}

  async status(playerId: PlayerId): Promise<BonusStatus> {
    const profile = await this.bonuses.getOrCreate(playerId);
    return this.toStatus(profile);
  }

  async claimDaily(playerId: PlayerId): Promise<Result<BonusStatus, DomainError>> {
    const result = await this.bonuses.claimDaily(
      playerId,
      env.BONUS_DAILY_FREE_SPINS,
      env.BONUS_DAILY_COOLDOWN_MS,
    );
    if (!result.claimed) {
      return err(new ConflictError('Daily reward already claimed — come back later'));
    }
    return ok(this.toStatus(result.profile));
  }

  grantFreeSpins(playerId: PlayerId, amount: number): Promise<BonusProfile> {
    return this.bonuses.addFreeSpins(playerId, amount);
  }

  useFreeSpin(playerId: PlayerId): Promise<boolean> {
    return this.bonuses.consumeFreeSpin(playerId);
  }

  private toStatus(profile: BonusProfile): BonusStatus {
    const nextDailyInMs = this.nextDailyInMs(profile.dailyLastClaimAt);
    return {
      freeSpins: profile.freeSpins,
      dailyStreak: profile.dailyStreak,
      canClaimDaily: nextDailyInMs === 0,
      nextDailyInMs,
    };
  }

  /** Ms until the daily can be claimed again (0 = now). */
  private nextDailyInMs(lastClaimAt: Date | null): number {
    if (!lastClaimAt) return 0;
    const elapsed = Date.now() - lastClaimAt.getTime();
    const remaining = env.BONUS_DAILY_COOLDOWN_MS - elapsed;
    return remaining > 0 ? remaining : 0;
  }
}
