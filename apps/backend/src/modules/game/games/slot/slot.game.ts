import { Injectable } from '@nestjs/common';
import type { GameDefinition, GameOutcome } from '../../engine/game-definition';
import type { RoundRng } from '../../engine/rng';
import { ok, type Result } from '@/shared/result';
import { type DomainError } from '@/shared/errors/domain-error';
import {
  LINE_COUNT,
  PAYLINES,
  PAYTABLE,
  REELS,
  ROWS,
  SYMBOLS,
  SYMBOL_WEIGHTS,
  type Symbol,
} from './slot.config';

/** Classic slot has no client params today; reserved for future bet-shaping. */
export interface SlotParams {
  readonly _empty?: never;
}

export interface SlotDetail {
  /** grid[col][row] symbol names. */
  grid: Symbol[][];
  wins: Array<{ line: number; symbol: Symbol; multiplier: number; lineWin: string }>;
}

const WEIGHTS = SYMBOLS.map((s) => SYMBOL_WEIGHTS[s]);

/**
 * Reference game implementation. Pure: same RNG sequence + stake => same result.
 * The engine handles stake/ledger/provably-fair/history; this only maps the
 * RNG stream to a 3x3 grid and computes line wins.
 */
@Injectable()
export class SlotGame implements GameDefinition<SlotParams, SlotDetail> {
  readonly id = 'slot-classic-3x3';
  readonly displayName = 'Classic Slot 3x3';

  validateParams(_raw: Record<string, unknown>): Result<SlotParams, DomainError> {
    return ok({});
  }

  evaluate(rng: RoundRng, _params: SlotParams, stake: bigint): GameOutcome<SlotDetail> {
    // 9 independent weighted draws → grid[col][row].
    const grid: Symbol[][] = [];
    for (let col = 0; col < REELS; col += 1) {
      const column: Symbol[] = [];
      for (let row = 0; row < ROWS; row += 1) {
        const idx = rng.weightedIndex(WEIGHTS);
        column.push(SYMBOLS[idx] ?? 'CHERRY');
      }
      grid.push(column);
    }

    // Integer line stake (stake split across lines). Remainder is not wagered.
    const lineStake = stake / BigInt(LINE_COUNT);

    const wins: SlotDetail['wins'] = [];
    let payout = 0n;

    PAYLINES.forEach((line, lineIdx) => {
      const cells: Symbol[] = line.map((row, col) => grid[col]?.[row] ?? 'CHERRY');
      const winSymbol = resolveLineSymbol(cells);
      if (winSymbol) {
        const multiplier = PAYTABLE[winSymbol];
        const lineWin = lineStake * BigInt(multiplier);
        payout += lineWin;
        wins.push({ line: lineIdx, symbol: winSymbol, multiplier, lineWin: lineWin.toString() });
      }
    });

    return { payout, detail: { grid, wins } };
  }
}

/**
 * A line wins if all three cells match, treating WILD as a substitute.
 * Returns the paying symbol (WILD-only line pays as WILD), or null.
 */
function resolveLineSymbol(cells: Symbol[]): Symbol | null {
  const nonWild = cells.filter((c) => c !== 'WILD');
  if (nonWild.length === 0) return 'WILD'; // three wilds
  const first = nonWild[0];
  const allSame = nonWild.every((c) => c === first);
  return allSame ? (first ?? null) : null;
}
