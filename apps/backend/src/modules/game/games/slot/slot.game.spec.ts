import { RoundRng } from '../../engine/rng';
import { SlotGame } from './slot.game';
import { LINE_COUNT, PAYTABLE } from './slot.config';

describe('SlotGame', () => {
  const game = new SlotGame();
  const stake = 100n; // divisible by LINE_COUNT (5) -> lineStake 20

  it('has a stable id and display name', () => {
    expect(game.id).toBe('slot-classic-3x3');
    expect(game.displayName).toBeTruthy();
  });

  it('validateParams accepts empty params', () => {
    const r = game.validateParams({});
    expect(r.ok).toBe(true);
  });

  it('is deterministic: same round seed -> identical result', () => {
    const a = game.evaluate(new RoundRng('seed-deterministic'), {}, stake);
    const b = game.evaluate(new RoundRng('seed-deterministic'), {}, stake);
    expect(a.payout).toBe(b.payout);
    expect(JSON.stringify(a.detail)).toBe(JSON.stringify(b.detail));
  });

  it('different seeds generally produce different grids', () => {
    const a = game.evaluate(new RoundRng('seed-A'), {}, stake);
    const b = game.evaluate(new RoundRng('seed-B'), {}, stake);
    expect(JSON.stringify(a.detail.grid)).not.toBe(JSON.stringify(b.detail.grid));
  });

  it('produces a 3x3 grid', () => {
    const { detail } = game.evaluate(new RoundRng('grid-shape'), {}, stake);
    expect(detail.grid).toHaveLength(3); // 3 reels
    for (const reel of detail.grid) expect(reel).toHaveLength(3); // 3 rows
  });

  it('payout never exceeds the theoretical max (all lines top symbol)', () => {
    // Max single round = LINE_COUNT lines all paying the top multiplier.
    const lineStake = stake / BigInt(LINE_COUNT);
    const topMultiplier = Math.max(...Object.values(PAYTABLE));
    const maxPayout = lineStake * BigInt(topMultiplier) * BigInt(LINE_COUNT);
    // Sample many rounds; none should breach the analytic ceiling.
    for (let i = 0; i < 2000; i += 1) {
      const { payout } = game.evaluate(new RoundRng(`max-${i}`), {}, stake);
      expect(payout).toBeLessThanOrEqual(maxPayout);
    }
  });

  it('payout is consistent with the reported winning lines', () => {
    // For each sampled round, summing line wins must equal total payout.
    for (let i = 0; i < 500; i += 1) {
      const { payout, detail } = game.evaluate(new RoundRng(`consistency-${i}`), {}, stake);
      const sum = detail.wins.reduce((acc, w) => acc + BigInt(w.lineWin), 0n);
      expect(sum).toBe(payout);
    }
  });

  it('a losing round has no wins and zero payout', () => {
    // Find a losing seed deterministically among samples.
    let foundLoss = false;
    for (let i = 0; i < 100 && !foundLoss; i += 1) {
      const { payout, detail } = game.evaluate(new RoundRng(`loss-${i}`), {}, stake);
      if (payout === 0n) {
        expect(detail.wins).toHaveLength(0);
        foundLoss = true;
      }
    }
    expect(foundLoss).toBe(true);
  });
});
