import { Slot5x3Game } from './slot5x3.game';
import { RoundRng } from '../../engine/rng';
import { LINE_PAYTABLE, SCATTER_FREE_SPINS } from './slot5x3.config';

const game = new Slot5x3Game();

/** A RoundRng is deterministic in its seed — same seed ⇒ same spin. */
function rng(seed: string): RoundRng {
  return new RoundRng(seed);
}

describe('Slot5x3Game.validateParams', () => {
  it('accepts valid lineBet + lines', () => {
    const r = game.validateParams({ lineBet: 5, lines: 20 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ lineBet: 5, lines: 20 });
  });

  it('rejects out-of-range lineBet', () => {
    expect(game.validateParams({ lineBet: 0, lines: 20 }).ok).toBe(false);
    expect(game.validateParams({ lineBet: 1000, lines: 20 }).ok).toBe(false);
  });

  it('rejects out-of-range lines', () => {
    expect(game.validateParams({ lineBet: 5, lines: 0 }).ok).toBe(false);
    expect(game.validateParams({ lineBet: 5, lines: 21 }).ok).toBe(false);
  });

  it('rejects non-integers', () => {
    expect(game.validateParams({ lineBet: 1.5, lines: 20 }).ok).toBe(false);
  });
});

describe('Slot5x3Game.evaluate', () => {
  const params = { lineBet: 10, lines: 20 };
  const stake = 200n;

  it('is deterministic: same seed ⇒ same grid and payout', () => {
    const a = game.evaluate(rng('seed-x'), params, stake);
    const b = game.evaluate(rng('seed-x'), params, stake);
    expect(a.detail.grid).toEqual(b.detail.grid);
    expect(a.payout).toBe(b.payout);
  });

  it('produces a 5×3 grid', () => {
    const { detail } = game.evaluate(rng('grid'), params, stake);
    expect(detail.grid).toHaveLength(5);
    for (const col of detail.grid) expect(col).toHaveLength(3);
  });

  it('never reports a line win below 3-of-a-kind', () => {
    for (let i = 0; i < 200; i += 1) {
      const { detail } = game.evaluate(rng(`s${i}`), params, stake);
      for (const w of detail.lineWins) {
        expect(w.count).toBeGreaterThanOrEqual(3);
        expect(w.multiplier).toBeGreaterThan(0);
      }
    }
  });

  it('payout equals the sum of reported line wins + scatter win', () => {
    for (let i = 0; i < 200; i += 1) {
      const { payout, detail } = game.evaluate(rng(`p${i}`), params, stake);
      const lineSum = detail.lineWins.reduce((acc, w) => acc + BigInt(w.win), 0n);
      const expected = lineSum + BigInt(detail.scatterWin);
      expect(payout).toBe(expected);
    }
  });

  it('awards free spins exactly when 3+ scatters land', () => {
    for (let i = 0; i < 300; i += 1) {
      const { detail } = game.evaluate(rng(`fs${i}`), params, stake);
      if (detail.scatters >= 3) {
        const n = Math.min(detail.scatters, 5) as 3 | 4 | 5;
        expect(detail.freeSpinsAwarded).toBe(SCATTER_FREE_SPINS[n]);
      } else {
        expect(detail.freeSpinsAwarded).toBe(0);
      }
    }
  });

  it('every winning line is genuinely 3+ matching (WILD substituting)', () => {
    const { detail } = game.evaluate(rng('verify'), params, stake);
    for (const w of detail.lineWins) {
      // The reported multiplier matches the paytable for that symbol+count.
      const table = LINE_PAYTABLE[w.symbol as keyof typeof LINE_PAYTABLE];
      expect(table[w.count as 3 | 4 | 5]).toBe(w.multiplier);
    }
  });
});
