import { createHmac } from 'node:crypto';

/**
 * Deterministic RNG stream for a single round, seeded from the provably-fair
 * per-round secret (`roundSeed`). A game pulls as many uniform [0,1) values /
 * ints as it needs; every value is reproducible from (roundSeed, cursor), so
 * the whole round is verifiable once the server seed is revealed.
 *
 * Games never touch crypto — they receive a RoundRng from the engine.
 */
export class RoundRng {
  private cursor = 0;

  /** @param roundSeed HMAC(serverSeed, `${clientSeed}:${nonce}`) — secret until reveal. */
  constructor(private readonly roundSeed: string) {}

  /** Next uniform float in [0, 1). */
  next(): number {
    const digest = createHmac('sha256', this.roundSeed).update(String(this.cursor)).digest('hex');
    this.cursor += 1;
    return parseInt(digest.slice(0, 13), 16) / 2 ** 52;
  }

  /** Next integer in [0, maxExclusive). */
  nextInt(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  /** Pick an index from weighted options (weights need not sum to 1). */
  weightedIndex(weights: readonly number[]): number {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i += 1) {
      r -= weights[i] ?? 0;
      if (r < 0) return i;
    }
    return weights.length - 1;
  }
}
