import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type { PlayerId } from '@casino/contracts';
import { asPlayerId } from '@casino/contracts';
import type {
  BonusProfile,
  DailyClaimResult,
  IBonusDataProvider,
} from '@/contracts/data-providers/bonus-data-provider.contract';
import { PG_POOL } from '@/shared/db/db.module';

interface BonusRow {
  player_id: string;
  free_spins: number;
  daily_last_claim_at: Date | null;
  daily_streak: number;
}

@Injectable()
export class PostgresBonusDataProvider implements IBonusDataProvider {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getOrCreate(playerId: PlayerId): Promise<BonusProfile> {
    const { rows } = await this.pool.query<BonusRow>(
      `INSERT INTO player_bonuses (player_id) VALUES ($1)
       ON CONFLICT (player_id) DO UPDATE SET player_id = EXCLUDED.player_id
       RETURNING player_id, free_spins, daily_last_claim_at, daily_streak`,
      [playerId],
    );
    return this.toDomain(this.require(rows[0]));
  }

  async addFreeSpins(playerId: PlayerId, amount: number): Promise<BonusProfile> {
    const { rows } = await this.pool.query<BonusRow>(
      `INSERT INTO player_bonuses (player_id, free_spins) VALUES ($1, $2)
       ON CONFLICT (player_id)
         DO UPDATE SET free_spins = player_bonuses.free_spins + EXCLUDED.free_spins,
                       updated_at = now()
       RETURNING player_id, free_spins, daily_last_claim_at, daily_streak`,
      [playerId, amount],
    );
    return this.toDomain(this.require(rows[0]));
  }

  async consumeFreeSpin(playerId: PlayerId): Promise<boolean> {
    // Single conditional UPDATE — decrements only if a spin is available, so
    // two concurrent spins can never both consume the same one.
    const { rowCount } = await this.pool.query(
      `UPDATE player_bonuses
          SET free_spins = free_spins - 1, updated_at = now()
        WHERE player_id = $1 AND free_spins > 0`,
      [playerId],
    );
    return rowCount === 1;
  }

  async claimDaily(playerId: PlayerId, freeSpinsReward: number, cooldownMs: number): Promise<DailyClaimResult> {
    await this.getOrCreate(playerId); // ensure a row exists

    // Atomic: apply the reward only if the cooldown has elapsed. The WHERE
    // clause makes a double-claim a no-op (0 rows updated).
    const interval = `${Math.floor(cooldownMs / 1000)} seconds`;
    const { rows } = await this.pool.query<BonusRow>(
      `UPDATE player_bonuses
          SET free_spins = free_spins + $2,
              daily_streak = daily_streak + 1,
              daily_last_claim_at = now(),
              updated_at = now()
        WHERE player_id = $1
          AND (daily_last_claim_at IS NULL OR daily_last_claim_at <= now() - $3::interval)
       RETURNING player_id, free_spins, daily_last_claim_at, daily_streak`,
      [playerId, freeSpinsReward, interval],
    );

    if (rows[0]) {
      return { claimed: true, profile: this.toDomain(rows[0]) };
    }
    // Still on cooldown — return the current profile unchanged.
    return { claimed: false, profile: await this.getOrCreate(playerId) };
  }

  private require(row: BonusRow | undefined): BonusRow {
    if (!row) throw new Error('bonus upsert returned no row');
    return row;
  }

  private toDomain(row: BonusRow): BonusProfile {
    return {
      playerId: asPlayerId(row.player_id),
      freeSpins: row.free_spins,
      dailyLastClaimAt: row.daily_last_claim_at,
      dailyStreak: row.daily_streak,
    };
  }
}
