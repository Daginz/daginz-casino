import { Injectable } from '@nestjs/common';
import { createHash, createHmac } from 'node:crypto';
import type {
  IProvablyFairService,
  RevealedSeed,
  SeedCommitment,
} from '@/contracts/provably-fair.contract';

/**
 * Provably-fair core. This is pure, deterministic logic (no I/O), so it is
 * fully implemented now — the rest of the system (seed storage, rotation)
 * lands in Block D, but the algorithm itself is stable.
 *
 * outcome = HMAC_SHA256(serverSeed, `${clientSeed}:${nonce}`) → first 8 hex
 *           digits mapped into [0, 1).
 */
@Injectable()
export class ProvablyFairService implements IProvablyFairService {
  outcome(commitment: SeedCommitment): number {
    // At commitment time we only have the hash; the real outcome needs the
    // server seed. For the stub we derive from the hash deterministically so
    // endpoints are wireable; Block D swaps in the revealed-seed HMAC.
    return this.toUnitInterval(commitment.serverSeedHash, commitment.clientSeed, commitment.nonce);
  }

  verify(revealed: RevealedSeed, claimedOutcome: number): boolean {
    const hash = createHash('sha256').update(revealed.serverSeed).digest('hex');
    if (hash !== revealed.serverSeedHash) return false;
    const recomputed = this.hmacOutcome(revealed.serverSeed, revealed.clientSeed, revealed.nonce);
    return Math.abs(recomputed - claimedOutcome) < 1e-9;
  }

  private hmacOutcome(serverSeed: string, clientSeed: string, nonce: number): number {
    const digest = createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
    return this.hexToUnit(digest);
  }

  private toUnitInterval(serverSeedHash: string, clientSeed: string, nonce: number): number {
    const digest = createHash('sha256')
      .update(`${serverSeedHash}:${clientSeed}:${nonce}`)
      .digest('hex');
    return this.hexToUnit(digest);
  }

  private hexToUnit(digest: string): number {
    const slice = digest.slice(0, 8);
    return parseInt(slice, 16) / 0x100000000;
  }
}
