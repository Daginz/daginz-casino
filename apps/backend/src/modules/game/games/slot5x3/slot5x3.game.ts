import { Injectable } from '@nestjs/common';
import type { GameDefinition, GameOutcome } from '../../engine/game-definition';
import type { RoundRng } from '../../engine/rng';
import { ok, err, type Result } from '@/shared/result';
import { ValidationError, type DomainError } from '@/shared/errors/domain-error';
import {
  LINE_PAYTABLE,
  MAX_LINE_BET,
  MAX_LINES,
  MIN_LINE_BET,
  PAYLINES,
  REELS,
  ROWS,
  SCATTER_FREE_SPINS,
  SCATTER_PAYTABLE,
  STRIPS,
  type Sym,
} from './slot5x3.config';

export interface Slot5x3Params {
  /** Bet per active line (CHIP minor units). */
  lineBet: number;
  /** Number of active paylines (1..20). */
  lines: number;
}

export interface LineWin {
  line: number;
  symbol: Sym;
  count: number;
  multiplier: number;
  win: string;
}

export interface Slot5x3Detail {
  /** grid[reel][row] visible symbols. */
  grid: Sym[][];
  lineWins: LineWin[];
  /** Scatter count + its flat win (× total bet) and any free spins awarded. */
  scatters: number;
  scatterWin: string;
  /** Free spins to grant to the player's bonus profile (engine applies it). */
  freeSpinsAwarded: number;
}

/**
 * 5×3, 20-line video slot. Pure: same RNG stream + params + stake ⇒ same grid
 * and payout. The engine handles ledger/provably-fair/history; the scatter free
 * spins are surfaced in `detail.freeSpinsAwarded` for the engine to credit.
 */
@Injectable()
export class Slot5x3Game implements GameDefinition<Slot5x3Params, Slot5x3Detail> {
  readonly id = 'slot-5x3-20line';
  readonly displayName = '5×3 · 20 Lines';

  validateParams(raw: Record<string, unknown>): Result<Slot5x3Params, DomainError> {
    const lineBet = Number(raw.lineBet);
    const lines = Number(raw.lines);
    if (!Number.isInteger(lineBet) || lineBet < MIN_LINE_BET || lineBet > MAX_LINE_BET) {
      return err(new ValidationError(`lineBet must be an integer in [${MIN_LINE_BET}, ${MAX_LINE_BET}]`));
    }
    if (!Number.isInteger(lines) || lines < 1 || lines > MAX_LINES) {
      return err(new ValidationError(`lines must be an integer in [1, ${MAX_LINES}]`));
    }
    return ok({ lineBet, lines });
  }

  evaluate(rng: RoundRng, params: Slot5x3Params, stake: bigint): GameOutcome<Slot5x3Detail> {
    const grid = this.spin(rng);
    const lineBet = BigInt(params.lineBet);
    const totalBet = BigInt(params.lineBet * params.lines);

    // ── line wins over the active paylines ──────────────────────────────
    const lineWins: LineWin[] = [];
    let payout = 0n;
    for (let i = 0; i < params.lines; i += 1) {
      const line = PAYLINES[i];
      if (!line) continue;
      const cells = line.map((row, reel) => grid[reel]?.[row] ?? 'TEN') as Sym[];
      const match = this.evaluateLine(cells);
      if (match) {
        const lineWin = lineBet * BigInt(match.multiplier);
        payout += lineWin;
        lineWins.push({ line: i, symbol: match.symbol, count: match.count, multiplier: match.multiplier, win: lineWin.toString() });
      }
    }

    // ── scatter pays (anywhere) + free-spin trigger ─────────────────────
    const scatters = this.countSymbol(grid, 'SCATTER');
    let scatterWin = 0n;
    let freeSpinsAwarded = 0;
    if (scatters >= 3) {
      const n = Math.min(scatters, 5) as 3 | 4 | 5;
      scatterWin = totalBet * BigInt(SCATTER_PAYTABLE[n]);
      payout += scatterWin;
      freeSpinsAwarded = SCATTER_FREE_SPINS[n];
    }
    void stake; // payout is derived from params (lineBet/lines), not raw stake

    return {
      payout,
      detail: {
        grid,
        lineWins,
        scatters,
        scatterWin: scatterWin.toString(),
        freeSpinsAwarded,
      },
    };
  }

  /** Spin each reel: pick a stop, take the 3 visible symbols (wrapped). */
  private spin(rng: RoundRng): Sym[][] {
    const grid: Sym[][] = [];
    for (let reel = 0; reel < REELS; reel += 1) {
      const strip = STRIPS[reel]!;
      const stop = rng.nextInt(strip.length);
      const col: Sym[] = [];
      for (let row = 0; row < ROWS; row += 1) {
        // top = stop-1, mid = stop, bottom = stop+1 (wrapped)
        const idx = (stop + row - 1 + strip.length) % strip.length;
        col.push(strip[idx]!);
      }
      grid.push(col);
    }
    return grid;
  }

  /**
   * A line wins if its first K cells (K>=3) are the same symbol with WILD
   * substituting. WILD-led lines pay as the first non-wild symbol; an all-wild
   * run pays as the best wild-eligible symbol (CROWN). SCATTER never lines up.
   */
  private evaluateLine(cells: Sym[]): { symbol: Sym; count: number; multiplier: number } | null {
    const first = cells[0];
    if (!first || first === 'SCATTER') return null;

    // Determine the paying symbol: the first non-WILD, or CROWN if all wild.
    type PaySym = Exclude<Sym, 'WILD' | 'SCATTER'>;
    let paySym: PaySym | null = first === 'WILD' ? null : (first as PaySym);
    let count = 0;
    for (const c of cells) {
      if (c === 'SCATTER') break;
      if (c === 'WILD') {
        count += 1;
        continue;
      }
      if (paySym === null) {
        paySym = c;
        count += 1;
        continue;
      }
      if (c === paySym) {
        count += 1;
        continue;
      }
      break;
    }

    const symbol: PaySym = paySym ?? 'CROWN'; // all-wild run pays as CROWN
    if (count < 3) return null;

    const multiplier = LINE_PAYTABLE[symbol][count as 3 | 4 | 5];
    if (!multiplier) return null;
    return { symbol, count, multiplier };
  }

  private countSymbol(grid: Sym[][], sym: Sym): number {
    let n = 0;
    for (const col of grid) for (const c of col) if (c === sym) n += 1;
    return n;
  }
}
