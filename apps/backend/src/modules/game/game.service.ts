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
 * Orchestrates a round across provably-fair + wallet — STUB (Block C).
 * Wiring and DI graph are real; full bet→outcome→payout→ledger flow is Block E.
 */
@Injectable()
export class GameService implements IGameService {
  constructor(
    @Inject(PROVABLY_FAIR_SERVICE) private readonly fair: IProvablyFairService,
    @Inject(WALLET_SERVICE) private readonly wallet: IWalletService,
  ) {}

  async placeBet(input: PlaceBetInput): Promise<Result<GameRound, DomainError>> {
    // Stub: derive a placeholder outcome so the wiring is demonstrable.
    const outcome = this.fair.outcome({
      serverSeedHash: randomUUID().replace(/-/g, ''),
      clientSeed: input.clientSeed,
      nonce: 0,
    });
    const round: GameRound = {
      id: asGameRoundId(randomUUID()),
      playerId: input.playerId,
      game: input.game,
      amount: input.amount,
      outcome,
      payout: 0n,
      serverSeedHash: 'stub-hash',
      clientSeed: input.clientSeed,
      nonce: 0,
      createdAt: new Date(),
    };
    return ok(round);
  }

  async getRound(id: GameRoundId): Promise<Result<GameRound, DomainError>> {
    return err(new EntityNotFoundError(`Round ${id} not found (stub)`));
  }
}
