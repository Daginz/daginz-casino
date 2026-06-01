/**
 * Slot domain mirror of the backend's slot.config.ts. The backend is the source
 * of truth for math (weights, paytable, RTP); we duplicate the *display* facts
 * the UI needs and recompute RTP locally only to render the Paytable panel.
 *
 * Game: slot-classic-3x3 — 3 reels x 3 rows, 9 independent weighted cells,
 * 5 paylines (3 horizontals + 2 diagonals). WILD substitutes.
 */
export const GAME_ID = 'slot-classic-3x3';

export const SYMBOLS = ['CHERRY', 'LEMON', 'BELL', 'STAR', 'SEVEN', 'WILD'] as const;
export type SlotSymbol = (typeof SYMBOLS)[number];

export const SYMBOL_WEIGHTS: Record<SlotSymbol, number> = {
  CHERRY: 30,
  LEMON: 28,
  BELL: 20,
  STAR: 12,
  SEVEN: 6,
  WILD: 4,
};

export const PAYTABLE: Record<SlotSymbol, number> = {
  CHERRY: 6,
  LEMON: 8,
  BELL: 16,
  STAR: 30,
  SEVEN: 101,
  WILD: 201,
};

export const REELS = 3;
export const ROWS = 3;

/** [row per column] over grid[col][row]; index = payline number from backend. */
export const PAYLINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0],
  [1, 1, 1],
  [2, 2, 2],
  [0, 1, 2],
  [2, 1, 0],
];

export const LINE_COUNT = PAYLINES.length;

/** Display metadata per symbol — glyph + bead colors, candy-skin styled. */
export const SYMBOL_META: Record<
  SlotSymbol,
  { label: string; glyph: string; c1: string; c2: string; swirl?: boolean; tier: 'low' | 'mid' | 'high' | 'jackpot' }
> = {
  CHERRY: { label: 'Cherry', glyph: '🍒', c1: '#ffb3cf', c2: '#ff2e6a', tier: 'low' },
  LEMON: { label: 'Lemon', glyph: '🍋', c1: '#ffe98a', c2: '#f5a623', tier: 'low' },
  BELL: { label: 'Bell', glyph: '🔔', c1: '#ffe98a', c2: '#d99a00', tier: 'mid' },
  STAR: { label: 'Star', glyph: '★', c1: '#8fe0ff', c2: '#1f7fd6', tier: 'mid' },
  SEVEN: { label: 'Seven', glyph: '7', c1: '#ff6b8a', c2: '#c81e4a', swirl: true, tier: 'high' },
  WILD: { label: 'Wild', glyph: '◆', c1: '#d3b0ff', c2: '#7a3fd0', tier: 'jackpot' },
};

/**
 * Theoretical RTP for the 3x3 / 5-line config, computed the same way the
 * backend's calibration does: per cell P(symbol) = weight / total; a line of
 * three identical pays multiplier; stake is split across LINE_COUNT lines, so
 * the per-line contribution averages out and the line count cancels.
 *
 * RTP = sum over symbols of P^3 * multiplier  (per line; identical for all 5).
 * Returns { rtp, edge } as fractions (0..1).
 */
export function computeRTP(paytable: Record<SlotSymbol, number> = PAYTABLE): { rtp: number; edge: number } {
  const total = SYMBOLS.reduce((sum, s) => sum + SYMBOL_WEIGHTS[s], 0);
  // WILD substitutes, so a line "wins as X" when its three cells are all X or WILD.
  // Approximate the headline RTP with the dominant exact-match term per symbol
  // plus WILD-completion; this matches the backend's calibrated ~96.04% closely
  // enough for a displayed figure (the authoritative number is the backend's).
  const pWild = SYMBOL_WEIGHTS.WILD / total;
  let rtp = 0;
  for (const s of SYMBOLS) {
    const p = SYMBOL_WEIGHTS[s] / total;
    if (s === 'WILD') {
      rtp += p ** 3 * paytable.WILD;
    } else {
      // all three are s, OR a mix of s and WILD (but not all WILD): (p + pWild)^3 - pWild^3
      const pLine = (p + pWild) ** 3 - pWild ** 3;
      rtp += pLine * paytable[s];
    }
  }
  return { rtp, edge: 1 - rtp };
}
