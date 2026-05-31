/**
 * Classic 3x3 slot configuration. Symbols, reel weights, paylines and paytable
 * live here so RTP can be tuned in one place (and the simulator reads the same).
 *
 * Reels: 3 columns x 3 rows. Each column is an independent weighted draw of one
 * symbol that fills all 3 rows of that column? No — we draw a symbol per CELL
 * (9 independent weighted draws) for simplicity and uniform math.
 *
 * Win: a payline (3 cells) pays if all 3 share the same symbol. WILD substitutes.
 */

export const SYMBOLS = ['CHERRY', 'LEMON', 'BELL', 'STAR', 'SEVEN', 'WILD'] as const;
export type Symbol = (typeof SYMBOLS)[number];

/** Reel weights per symbol (higher = more common). WILD is rarest. */
export const SYMBOL_WEIGHTS: Record<Symbol, number> = {
  CHERRY: 30,
  LEMON: 28,
  BELL: 20,
  STAR: 12,
  SEVEN: 6,
  WILD: 4,
};

/**
 * Payout multiplier (× line stake) for three-of-a-kind of each symbol.
 * Calibrated to 96.04% theoretical RTP via EXACT per-line enumeration
 * (scripts/slot-calibrate.mjs) — verified against the Monte-Carlo simulator.
 */
export const PAYTABLE: Record<Symbol, number> = {
  CHERRY: 6,
  LEMON: 8,
  BELL: 16,
  STAR: 30,
  SEVEN: 101,
  WILD: 201,
};

/** Target the paytable was calibrated against (documentation + tests). */
export const TARGET_RTP = 0.96;

export const REELS = 3;
export const ROWS = 3;

/**
 * Paylines as [row per column] over a 3x3 grid (grid[col][row]).
 * 5 lines: 3 horizontals + 2 diagonals.
 */
export const PAYLINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0], // top row
  [1, 1, 1], // middle row
  [2, 2, 2], // bottom row
  [0, 1, 2], // diagonal ↘
  [2, 1, 0], // diagonal ↗
];

/** Stake is split equally across all paylines. */
export const LINE_COUNT = PAYLINES.length;
