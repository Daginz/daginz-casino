/**
 * Industry-standard 5-reel × 3-row video slot.
 *
 * Each reel is an explicit weighted STRIP (a band of symbols). A spin picks a
 * random stop per reel; the 3 visible cells are the symbols at stop-1, stop,
 * stop+1 (wrapped). This produces realistic reel bands + near-misses, unlike
 * independent per-cell draws. Wins are evaluated over 20 fixed paylines,
 * left-to-right, 3-of-a-kind minimum, WILD substituting (never SCATTER).
 * SCATTER pays anywhere and, at 3+, triggers free spins.
 *
 * Payouts here are an initial guess; scripts/slot5x3-calibrate.mjs tunes them
 * to ~96% RTP by Monte-Carlo and the result is pinned in tests.
 */

export const SYMBOLS = ['TEN', 'JACK', 'QUEEN', 'KING', 'ACE', 'GEM', 'CROWN', 'WILD', 'SCATTER'] as const;
export type Sym = (typeof SYMBOLS)[number];

export const REELS = 5;
export const ROWS = 3;

/** Per-reel strips (weighted by repetition). High symbols + WILD are rarer on
 *  later reels; SCATTER is sparse everywhere. Length differs per reel on
 *  purpose so reels feel distinct. */
export const STRIPS: readonly Sym[][] = [
  // Reel 1 — friendliest (more highs/wild so the eye catches starts)
  ['TEN', 'JACK', 'GEM', 'QUEEN', 'TEN', 'KING', 'ACE', 'WILD', 'JACK', 'CROWN', 'TEN', 'QUEEN', 'SCATTER', 'JACK', 'KING', 'TEN', 'ACE', 'QUEEN', 'GEM', 'JACK'],
  // Reel 2
  ['JACK', 'TEN', 'QUEEN', 'KING', 'JACK', 'GEM', 'TEN', 'ACE', 'WILD', 'QUEEN', 'JACK', 'CROWN', 'TEN', 'KING', 'SCATTER', 'QUEEN', 'JACK', 'ACE', 'TEN', 'GEM', 'KING'],
  // Reel 3 — middle reel, where wilds matter most
  ['TEN', 'QUEEN', 'JACK', 'ACE', 'KING', 'TEN', 'GEM', 'WILD', 'QUEEN', 'JACK', 'CROWN', 'TEN', 'KING', 'ACE', 'SCATTER', 'QUEEN', 'JACK', 'TEN', 'GEM', 'WILD', 'KING', 'ACE'],
  // Reel 4
  ['KING', 'TEN', 'JACK', 'QUEEN', 'ACE', 'TEN', 'GEM', 'JACK', 'WILD', 'KING', 'QUEEN', 'TEN', 'CROWN', 'JACK', 'ACE', 'SCATTER', 'TEN', 'QUEEN', 'KING', 'GEM', 'JACK'],
  // Reel 5 — tightest (fewest highs/wild → 5-of-a-kind is hard)
  ['TEN', 'JACK', 'QUEEN', 'TEN', 'KING', 'JACK', 'ACE', 'TEN', 'GEM', 'QUEEN', 'WILD', 'JACK', 'TEN', 'CROWN', 'KING', 'SCATTER', 'QUEEN', 'JACK', 'TEN', 'ACE', 'GEM', 'KING'],
];

/**
 * 20 fixed paylines as [row per reel] over grid[reel][row] (rows 0=top..2=bottom).
 * Standard NetEnt/IGT-style layout: 3 horizontals, V/^ shapes, zig-zags.
 */
export const PAYLINES: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [1, 1, 1, 1, 1], // mid
  [0, 0, 0, 0, 0], // top
  [2, 2, 2, 2, 2], // bottom
  [0, 1, 2, 1, 0], // V
  [2, 1, 0, 1, 2], // ^
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [1, 0, 1, 2, 1],
  [1, 2, 1, 0, 1],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2],
  [0, 2, 0, 2, 0],
];

export const LINE_COUNT = PAYLINES.length;
export const MAX_LINES = LINE_COUNT;

/**
 * Line paytable: multiplier (× LINE bet) for N-of-a-kind from the left.
 * Index [3],[4],[5] used. WILD pays as the line symbol it completes.
 * CALIBRATED to ~96.3% cash RTP by Monte-Carlo (scripts/slot5x3-calibrate.mjs,
 * 4M spins). Scatter free-spin value is on top of this.
 */
export const LINE_PAYTABLE: Record<Exclude<Sym, 'WILD' | 'SCATTER'>, { 3: number; 4: number; 5: number }> = {
  TEN: { 3: 5, 4: 15, 5: 52 },
  JACK: { 3: 5, 4: 15, 5: 52 },
  QUEEN: { 3: 9, 4: 26, 5: 88 },
  KING: { 3: 12, 4: 33, 5: 130 },
  ACE: { 3: 16, 4: 44, 5: 190 },
  GEM: { 3: 25, 4: 75, 5: 350 },
  CROWN: { 3: 30, 4: 120, 5: 600 },
};

/** SCATTER pays × TOTAL bet for N scatters anywhere on the grid. */
export const SCATTER_PAYTABLE: Record<3 | 4 | 5, number> = { 3: 5, 4: 15, 5: 60 };

/** Free spins awarded when N scatters land (credited to the bonus profile). */
export const SCATTER_FREE_SPINS: Record<3 | 4 | 5, number> = { 3: 10, 4: 15, 5: 25 };

/** Bet sizing guardrails (line bet in CHIP minor units). */
export const MIN_LINE_BET = 1;
export const MAX_LINE_BET = 100;

export const TARGET_RTP = 0.96;

/** Symbols that can never appear as part of a normal payline match. */
export function isSpecial(s: Sym): boolean {
  return s === 'WILD' || s === 'SCATTER';
}
