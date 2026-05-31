import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { GameRoundId } from '@casino/contracts';
import { asGameRoundId } from '@casino/contracts';
import {
  type GameRound,
  type IGameService,
  type PlaceBetInput,
} from '@/contracts/game.contract';
import {
  PROVABLY_FAIR_SERVICE,
  type IProvablyFairService,
} from '@/contracts/provably-fair.contract';
import { WALLET_SERVICE, type IWalletService } from '@/contracts/wallet.contract';
import { err, ok, type Result } from '@/shared/result';
import { DomainError, EntityNotFoundError } from '@/shared/errors/domain-error';

/**
 * Orchestrates a round across provably-fair + wallet — STUB (Block C/D).
 * The full generic round lifecycle and the GameDefinition registry land in
 * Block E (Game Engine framework). For now this just exercises the real
 * provably-fair draw so the DI graph and PF service are verifiable.
 */
@Injectable()
export class GameService implements IGameService {
  constructor(
    @Inject(PROVABLY_FAIR_SERVICE) private readonly fair: IProvablyFairService,
    @Inject(WALLET_SERVICE) private readonly wallet: IWalletService,
  ) {}

  async placeBet(input: PlaceBetInput): Promise<Result<GameRound, DomainError>> {
    const draw = await this.fair.draw(input.playerId);
    if (!draw.ok) return err(draw.error);

    const round: GameRound = {
      id: asGameRoundId(randomUUID()),
      playerId: input.playerId,
      game: input.game,
      amount: input.amount,
      outcome: draw.value.outcome,
      payout: 0n, // payout calc belongs to the GameDefinition (Block E)
      serverSeedHash: draw.value.serverSeedHash,
      clientSeed: draw.value.clientSeed,
      nonce: draw.value.nonce,
      createdAt: new Date(),
    };
    return ok(round);
  }

  async getRound(id: GameRoundId): Promise<Result<GameRound, DomainError>> {
    return err(new EntityNotFoundError(`Round ${id} not found (stub)`));
  }
}
