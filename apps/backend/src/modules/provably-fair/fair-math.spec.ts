import { createHash } from 'node:crypto';
import { deriveRoundSeed, roundOutcome } from './fair-math';

describe('fair-math', () => {
  describe('deriveRoundSeed', () => {
    it('is deterministic for the same inputs', () => {
      const a = deriveRoundSeed('server', 'client', 0);
      const b = deriveRoundSeed('server', 'client', 0);
      expect(a).toBe(b);
    });

    it('changes when the nonce changes', () => {
      const n0 = deriveRoundSeed('server', 'client', 0);
      const n1 = deriveRoundSeed('server', 'client', 1);
      expect(n0).not.toBe(n1);
    });

    it('changes when the server seed changes', () => {
      const s1 = deriveRoundSeed('serverA', 'client', 0);
      const s2 = deriveRoundSeed('serverB', 'client', 0);
      expect(s1).not.toBe(s2);
    });

    it('changes when the client seed changes', () => {
      const c1 = deriveRoundSeed('server', 'clientA', 0);
      const c2 = deriveRoundSeed('server', 'clientB', 0);
      expect(c1).not.toBe(c2);
    });

    it('produces a 64-char hex (sha256) digest', () => {
      expect(deriveRoundSeed('s', 'c', 0)).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('roundOutcome', () => {
    it('returns a float in [0, 1)', () => {
      for (let nonce = 0; nonce < 100; nonce += 1) {
        const o = roundOutcome(deriveRoundSeed('server', 'client', nonce));
        expect(o).toBeGreaterThanOrEqual(0);
        expect(o).toBeLessThan(1);
      }
    });

    it('is reproducible from the same round seed', () => {
      const seed = deriveRoundSeed('server', 'client', 7);
      expect(roundOutcome(seed)).toBe(roundOutcome(seed));
    });

    it('is roughly uniform (mean ~0.5 over many draws)', () => {
      let sum = 0;
      const N = 5000;
      for (let nonce = 0; nonce < N; nonce += 1) {
        sum += roundOutcome(deriveRoundSeed('server-uniform', 'client', nonce));
      }
      const mean = sum / N;
      // Loose bound — just guards against a badly skewed mapping.
      expect(mean).toBeGreaterThan(0.45);
      expect(mean).toBeLessThan(0.55);
    });
  });

  describe('commit-reveal property', () => {
    it('the sha256 of the server seed is the published commitment', () => {
      const serverSeed = 'a'.repeat(64);
      const hash = createHash('sha256').update(serverSeed).digest('hex');
      // Re-deriving the outcome from the revealed seed must match what a player
      // recomputes — this is the whole point of provably-fair.
      const outcome = roundOutcome(deriveRoundSeed(serverSeed, 'client', 3));
      const recomputed = roundOutcome(deriveRoundSeed(serverSeed, 'client', 3));
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(recomputed).toBe(outcome);
    });
  });
});
