import { Inject, Injectable } from '@nestjs/common';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import type { PlayerId } from '@casino/contracts';
import type {
  ActiveCommitment,
  FairDraw,
  IProvablyFairService,
  RevealedSeed,
} from '@/contracts/provably-fair.contract';
import {
  SEED_DATA_PROVIDER,
  type ISeedDataProvider,
  type SeedPair,
} from '@/contracts/data-providers/seed-data-provider.contract';
import { err, ok, type Result } from '@/shared/result';
import { DomainError, EntityNotFoundError } from '@/shared/errors/domain-error';

/**
 * Provably-fair commit-reveal. The outcome of a round is fully determined by
 * (serverSeed, clientSeed, nonce); the serverSeed hash is committed before
 * play and the seed revealed after, so any player can verify fairness.
 *
 * Shared by every game: a game never rolls its own RNG.
 */
@Injectable()
export class ProvablyFairService implements IProvablyFairService {
  constructor(@Inject(SEED_DATA_PROVIDER) private readonly seeds: ISeedDataProvider) {}

  async getActiveCommitment(playerId: PlayerId): Promise<ActiveCommitment> {
    const seed = await this.ensureActive(playerId);
    return { serverSeedHash: seed.serverSeedHash, clientSeed: seed.clientSeed, nonce: seed.nonce };
  }

  async draw(playerId: PlayerId): Promise<Result<FairDraw, DomainError>> {
    await this.ensureActive(playerId);
    const drawn = await this.seeds.drawNonce(playerId);
    if (!drawn) return err(new EntityNotFoundError('No active seed to draw from'));

    const outcome = this.hmacOutcome(drawn.serverSeed, drawn.clientSeed, drawn.nonce);
    return ok({
      outcome,
      serverSeedHash: drawn.serverSeedHash,
      clientSeed: drawn.clientSeed,
      nonce: drawn.nonce,
    });
  }

  async rotate(playerId: PlayerId, clientSeed: string): Promise<ActiveCommitment> {
    await this.seeds.revealActive(playerId); // retire current, if any
    const created = await this.createSeed(playerId, clientSeed);
    return {
      serverSeedHash: created.serverSeedHash,
      clientSeed: created.clientSeed,
      nonce: created.nonce,
    };
  }

  async reveal(playerId: PlayerId): Promise<Result<RevealedSeed, DomainError>> {
    const revealed = await this.seeds.revealActive(playerId);
    if (!revealed) return err(new EntityNotFoundError('No active seed to reveal'));
    return ok({
      serverSeed: revealed.serverSeed,
      serverSeedHash: revealed.serverSeedHash,
      clientSeed: revealed.clientSeed,
      nonce: revealed.nonce,
    });
  }

  verify(revealed: RevealedSeed, claimedOutcome: number): boolean {
    const hash = createHash('sha256').update(revealed.serverSeed).digest('hex');
    if (hash !== revealed.serverSeedHash) return false;
    const recomputed = this.hmacOutcome(revealed.serverSeed, revealed.clientSeed, revealed.nonce);
    return Math.abs(recomputed - claimedOutcome) < 1e-12;
  }

  private async ensureActive(playerId: PlayerId): Promise<SeedPair> {
    const existing = await this.seeds.findActive(playerId);
    if (existing) return existing;
    // Default client seed if the player hasn't chosen one.
    return this.createSeed(playerId, randomBytes(8).toString('hex'));
  }

  private async createSeed(playerId: PlayerId, clientSeed: string): Promise<SeedPair> {
    const serverSeed = randomBytes(32).toString('hex');
    const serverSeedHash = createHash('sha256').update(serverSeed).digest('hex');
    return this.seeds.createActive({ playerId, serverSeed, serverSeedHash, clientSeed });
  }

  private hmacOutcome(serverSeed: string, clientSeed: string, nonce: number): number {
    const digest = createHmac('sha256', serverSeed)
      .update(`${clientSeed}:${nonce}`)
      .digest('hex');
    // First 13 hex chars → 52 bits → uniform float in [0, 1).
    return parseInt(digest.slice(0, 13), 16) / 2 ** 52;
  }
}
