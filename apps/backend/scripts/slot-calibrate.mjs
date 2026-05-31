// Calibrate the slot paytable to a target RTP. Computes the EXACT theoretical
// RTP by enumerating all 6^3 = 216 combinations for one payline (cheap), which
// is the source of truth — it matches the Monte-Carlo simulator. Then solves
// for integer multipliers that hit the target RTP.
//
// NOTE: an earlier closed-form formula (p_s + pWild)^3 - pWild^3 OVER-counted
// wild interactions (0.961 vs true 0.887); enumeration avoids that class of bug.
import {
  SYMBOLS, SYMBOL_WEIGHTS, PAYTABLE,
} from '../dist/modules/game/games/slot/slot.config.js';

const total = SYMBOLS.reduce((a, s) => a + SYMBOL_WEIGHTS[s], 0);
const p = Object.fromEntries(SYMBOLS.map((s) => [s, SYMBOL_WEIGHTS[s] / total]));

function resolveLine(cells) {
  const nonWild = cells.filter((c) => c !== 'WILD');
  if (nonWild.length === 0) return 'WILD';
  const first = nonWild[0];
  return nonWild.every((c) => c === first) ? first : null;
}

/** Exact probability that one payline pays each symbol (enumerate 216 combos). */
function lineWinProbs() {
  const prob = Object.fromEntries(SYMBOLS.map((s) => [s, 0]));
  for (const a of SYMBOLS)
    for (const b of SYMBOLS)
      for (const c of SYMBOLS) {
        const pr = p[a] * p[b] * p[c];
        const sym = resolveLine([a, b, c]);
        if (sym) prob[sym] += pr;
      }
  return prob;
}

const probs = lineWinProbs();

/** Per-line EV (= overall RTP, since stake splits evenly across lines). */
const rtpOf = (table) => SYMBOLS.reduce((ev, s) => ev + probs[s] * table[s], 0);

const currentRTP = rtpOf(PAYTABLE);
console.log('per-line win probs   :', Object.fromEntries(SYMBOLS.map((s) => [s, probs[s].toExponential(3)])));
console.log('current RTP (exact)  :', (currentRTP * 100).toFixed(3) + '%');

const TARGET = 0.96;
const scale = TARGET / currentRTP;
const suggested = Object.fromEntries(SYMBOLS.map((s) => [s, Math.max(1, Math.round(PAYTABLE[s] * scale))]));
console.log('scale to hit 96%     :', scale.toFixed(4));
console.log('suggested multipliers:', JSON.stringify(suggested));
console.log('suggested table RTP  :', (rtpOf(suggested) * 100).toFixed(3) + '%');
