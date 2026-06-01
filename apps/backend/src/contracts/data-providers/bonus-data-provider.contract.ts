import type { PlayerId } from '@casino/contracts';

/** Persistence port for the player bonus profile (free spins + daily rewards). */
export const BONUS_DATA_PROVIDER = Symbol('BONUS_DATA_PROVIDER');

export interface BonusProfile {
  playerId: PlayerId;
  freeSpins: number;
  dailyLastClaimAt: Date | null;
  dailyStreak: number;
}

export interface DailyClaimResult {
  /** True if the claim was applied; false if still on cooldown. */
  claimed: boolean;
  /** The profile after the attempt (free spins, last-claim, streak). */
  profile: BonusProfile;
}

export interface IBonusDataProvider {
  /** Find-or-create the player's bonus row (zeroed if new). */
  getOrCreate(playerId: PlayerId): Promise<BonusProfile>;

  /** Add free spins to a player (e.g. scatter trigger, daily reward). */
  addFreeSpins(playerId: PlayerId, amount: number): Promise<BonusProfile>;

  /**
   * Atomically consume ONE free spin. Returns true only if a spin was actually
   * decremented (i.e. the player had at least one). Race-safe.
   */
  consumeFreeSpin(playerId: PlayerId): Promise<boolean>;

  /**
   * Atomically claim the daily reward if the cooldown has elapsed. Adds
   * `freeSpinsReward` and advances the streak. Returns claimed=false (no-op)
   * if still within `cooldownMs` of the last claim. Race-safe (single UPDATE).
   */
  claimDaily(playerId: PlayerId, freeSpinsReward: number, cooldownMs: number): Promise<DailyClaimResult>;
}
