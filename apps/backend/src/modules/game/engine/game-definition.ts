import type { Result } from '@/shared/result';
import type { DomainError } from '@/shared/errors/domain-error';
import type { RoundRng } from './rng';

/**
 * The ONE interface every game implements. The generic GameEngine handles
 * stake/ledger/provably-fair/history/events; a game only declares:
 *   - how to validate its params,
 *   - how to turn an RNG stream + stake into a payout (and a detail blob).
 *
 * Adding a new game = implement this + register it. No engine changes.
 *
 * @template P - validated params shape for this game (e.g. SlotParams)
 * @template D - game-specific round detail persisted as JSON (e.g. grid+lines)
 */
export interface GameDefinition<P = unknown, D = unknown> {
  /** Stable id used in API + storage, e.g. 'slot-classic-3x3'. */
  readonly id: string;
  readonly displayName: string;

  /** Validate raw client params; return typed params or a DomainError. */
  validateParams(raw: Record<string, unknown>): Result<P, DomainError>;

  /**
   * Pure evaluation: given the round RNG, validated params and the stake,
   * return the payout (minor units) and a detail object for history/replay.
   * MUST be deterministic in (rng sequence, params, stake) — no Date/Math.random.
   */
  evaluate(rng: RoundRng, params: P, stake: bigint): GameOutcome<D>;
}

export interface GameOutcome<D> {
  /** Total payout in minor units (0 = loss). */
  payout: bigint;
  /** Game-specific detail, JSON-serialisable, for history + provably-fair replay. */
  detail: D;
}
