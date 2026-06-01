import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { GameRoundId, PlayerId } from '@casino/contracts';
import {
  PROVABLY_FAIR_SERVICE,
  type IProvablyFairService,
} from '@/contracts/provably-fair.contract';
import { WALLET_SERVICE, type IWalletService } from '@/contracts/wallet.contract';
import { BONUS_SERVICE, type IBonusService } from '@/contracts/bonus.contract';
import { EVENT_BUS, type IEventBus } from '@/contracts/events.contract';
import {
  GAME_ROUND_DATA_PROVIDER,
  type IGameRoundDataProvider,
  type StoredRound,
} from '@/contracts/data-providers/game-round-data-provider.contract';
import { err, ok, type Result } from '@/shared/result';
import {
  EntityNotFoundError,
  ValidationError,
  type DomainError,
} from '@/shared/errors/domain-error';
import { GAME_REGISTRY, GameRegistry } from './game-registry';
import { RoundRng } from './rng';

export interface PlayRoundInput {
  playerId: PlayerId;
  gameId: string;
  stake: bigint;
  params: Record<string, unknown>;
  /** If true and the player has a free spin, it pays for the round instead of the ledger. */
  useFreeSpin?: boolean;
}

/**
 * Generic round lifecycle, identical for every game:
 *   validate → bet (ledger) → pf.draw → definition.evaluate → win (ledger)
 *   → persist round → return.
 * The ONLY game-specific step is definition.evaluate(). Adding a game never
 * touches this class.
 */
@Injectable()
export class GameEngineService {
  constructor(
    @Inject(GAME_REGISTRY) private readonly registry: GameRegistry,
    @Inject(PROVABLY_FAIR_SERVICE) private readonly fair: IProvablyFairService,
    @Inject(WALLET_SERVICE) private readonly wallet: IWalletService,
    @Inject(BONUS_SERVICE) private readonly bonus: IBonusService,
    @Inject(GAME_ROUND_DATA_PROVIDER) private readonly rounds: IGameRoundDataProvider,
    @Inject(EVENT_BUS) private readonly events: IEventBus,
  ) {}

  async play(input: PlayRoundInput): Promise<Result<StoredRound, DomainError>> {
    const def = this.registry.get(input.gameId);
    if (!def) return err(new EntityNotFoundError(`Unknown game: ${input.gameId}`));
    if (input.stake <= 0n) return err(new ValidationError('Stake must be positive'));

    const validated = def.validateParams(input.params);
    if (!validated.ok) return err(validated.error);

    // 1. Pay for the round. Bet SOURCE is pluggable: a free spin (promo) if the
    //    player has one and asked to use it, otherwise the real ledger balance.
    //    The engine stays stateless — only where the stake comes from changes.
    const roundKey = randomUUID();
    let paidWithFreeSpin = false;
    if (input.useFreeSpin) {
      paidWithFreeSpin = await this.bonus.useFreeSpin(input.playerId);
      if (!paidWithFreeSpin) {
        return err(new ValidationError('No free spins available'));
      }
    } else {
      const bet = await this.wallet.bet({
        playerId: input.playerId,
        amount: input.stake,
        idempotencyKey: `bet:${roundKey}`,
        reference: input.gameId,
      });
      if (!bet.ok) return err(bet.error);
    }

    // 2. Provably-fair draw → seed the round RNG from the per-round secret.
    const draw = await this.fair.draw(input.playerId);
    if (!draw.ok) return err(draw.error);
    const rng = new RoundRng(draw.value.roundSeed);

    // 3. Game-specific evaluation (the only pluggable step).
    const result = def.evaluate(rng, validated.value, input.stake);

    // 4. Credit winnings (if any).
    if (result.payout > 0n) {
      const win = await this.wallet.win({
        playerId: input.playerId,
        amount: result.payout,
        idempotencyKey: `win:${roundKey}`,
        reference: input.gameId,
      });
      if (!win.ok) return err(win.error);
    }

    // 4b. A game may award free spins (e.g. a scatter trigger). Credited to the
    //     bonus profile — a promo grant, not a ledger movement.
    const awarded = freeSpinsAwarded(result.detail);
    if (awarded > 0) {
      await this.bonus.grantFreeSpins(input.playerId, awarded);
    }

    // 5. Persist round history.
    const stored = await this.rounds.save({
      playerId: input.playerId,
      game: input.gameId,
      stake: input.stake,
      payout: result.payout,
      // The verifiable provably-fair draw outcome (recomputable from the
      // revealed seed), not a game-specific scalar.
      outcome: draw.value.outcome,
      serverSeedHash: draw.value.serverSeedHash,
      clientSeed: draw.value.clientSeed,
      nonce: draw.value.nonce,
      detail: result.detail,
    });

    // Publish after the round is committed — subscribers (reporting/risk/crm)
    // react async without blocking the player's response.
    await this.events.publish({
      name: 'game.round.completed',
      roundId: stored.id,
      playerId: stored.playerId,
      game: stored.game,
      stake: stored.stake.toString(),
      payout: stored.payout.toString(),
      createdAt: stored.createdAt.toISOString(),
    });

    return ok(stored);
  }

  async getRound(id: GameRoundId): Promise<Result<StoredRound, DomainError>> {
    const round = await this.rounds.findById(id);
    if (!round) return err(new EntityNotFoundError(`Round ${id} not found`));
    return ok(round);
  }

  history(playerId: PlayerId, limit: number): Promise<StoredRound[]> {
    return this.rounds.listByPlayer(playerId, limit);
  }

  listGames(): Array<{ id: string; displayName: string }> {
    return this.registry.list();
  }
}

/**
 * Read an optional `freeSpinsAwarded` from a game's detail blob, generically.
 * A game opts into free-spin grants just by putting this field in its detail
 * (e.g. the 5×3 slot's scatter trigger); other games simply don't.
 */
function freeSpinsAwarded(detail: unknown): number {
  if (detail && typeof detail === 'object' && 'freeSpinsAwarded' in detail) {
    const v = (detail as { freeSpinsAwarded: unknown }).freeSpinsAwarded;
    if (typeof v === 'number' && Number.isInteger(v) && v > 0) return v;
  }
  return 0;
}
