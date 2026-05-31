// Cross-check: does the calibrator's analytic per-line EV match an EXACT
// enumeration of all 6^3 = 216 line combinations? If yes, the formula is
// correct and the sim discrepancy is in the simulator, not the math.
const SYMBOLS = ['CHERRY', 'LEMON', 'BELL', 'STAR', 'SEVEN', 'WILD'];
const W = { CHERRY: 30, LEMON: 28, BELL: 20, STAR: 12, SEVEN: 6, WILD: 4 };
const PAY = { CHERRY: 6, LEMON: 7, BELL: 15, STAR: 28, SEVEN: 93, WILD: 186 };

const total = SYMBOLS.reduce((a, s) => a + W[s], 0);
const p = Object.fromEntries(SYMBOLS.map((s) => [s, W[s] / total]));

function resolveLine(cells) {
  const nonWild = cells.filter((c) => c !== 'WILD');
  if (nonWild.length === 0) return 'WILD';
  const first = nonWild[0];
  return nonWild.every((c) => c === first) ? first : null;
}

// EXACT per-line EV by enumerating all 216 combos for one 3-cell line.
let evExact = 0;
for (const a of SYMBOLS)
  for (const b of SYMBOLS)
    for (const c of SYMBOLS) {
      const prob = p[a] * p[b] * p[c];
      const sym = resolveLine([a, b, c]);
      if (sym) evExact += prob * PAY[sym];
    }

// Analytic formula used by the calibrator.
const pWild = p['WILD'];
const lineWinProb = (s) => (s === 'WILD' ? pWild ** 3 : (p[s] + pWild) ** 3 - pWild ** 3);
let evFormula = 0;
for (const s of SYMBOLS) evFormula += lineWinProb(s) * PAY[s];

console.log('EXACT per-line EV  :', evExact.toFixed(6));
console.log('FORMULA per-line EV:', evFormula.toFixed(6));
console.log('match:', Math.abs(evExact - evFormula) < 1e-9);
console.log('=> theoretical RTP :', (evExact * 100).toFixed(3) + '%');
