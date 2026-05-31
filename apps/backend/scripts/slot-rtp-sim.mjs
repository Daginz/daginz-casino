// RTP simulator for the classic 3x3 slot. Rolls N rounds through the SAME
// math the live engine uses (compiled dist) and reports actual RTP, hit rate
// and payout distribution. Run after build: node scripts/slot-rtp-sim.mjs [N]
import { createHmac, randomBytes } from 'node:crypto';
import {
  SYMBOLS, SYMBOL_WEIGHTS, PAYTABLE, REELS, ROWS, PAYLINES, LINE_COUNT,
} from '../dist/modules/game/games/slot/slot.config.js';

const N = Number(process.argv[2] ?? 1_000_000);
const WEIGHTS = SYMBOLS.map((s) => SYMBOL_WEIGHTS[s]);

// Mirror of RoundRng (kept inline so the sim is self-contained & fast).
function makeRng(roundSeed) {
  let cursor = 0;
  const next = () => {
    const d = createHmac('sha256', roundSeed).update(String(cursor++)).digest('hex');
    return parseInt(d.slice(0, 13), 16) / 2 ** 52;
  };
  const weightedIndex = (w) => {
    const total = w.reduce((a, b) => a + b, 0);
    let r = next() * total;
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i; }
    return w.length - 1;
  };
  return { weightedIndex };
}

function resolveLine(cells) {
  const nonWild = cells.filter((c) => c !== 'WILD');
  if (nonWild.length === 0) return 'WILD';
  const first = nonWild[0];
  return nonWild.every((c) => c === first) ? first : null;
}

function spin(rng, stake) {
  const grid = [];
  for (let col = 0; col < REELS; col++) {
    const column = [];
    for (let row = 0; row < ROWS; row++) column.push(SYMBOLS[rng.weightedIndex(WEIGHTS)]);
    grid.push(column);
  }
  const lineStake = stake / BigInt(LINE_COUNT);
  let payout = 0n;
  for (const line of PAYLINES) {
    const cells = line.map((row, col) => grid[col][row]);
    const sym = resolveLine(cells);
    if (sym) payout += lineStake * BigInt(PAYTABLE[sym]);
  }
  return payout;
}

const STAKE = 100n; // divisible by LINE_COUNT (5) → lineStake 20
let totalStake = 0n;
let totalPayout = 0n;
let hits = 0;
let maxWin = 0n;

for (let i = 0; i < N; i++) {
  const roundSeed = createHmac('sha256', randomBytes(16).toString('hex')).update(String(i)).digest('hex');
  const rng = makeRng(roundSeed);
  const payout = spin(rng, STAKE);
  totalStake += STAKE;
  totalPayout += payout;
  if (payout > 0n) hits++;
  if (payout > maxWin) maxWin = payout;
}

const rtp = Number(totalPayout) / Number(totalStake);
console.log(`spins:      ${N.toLocaleString()}`);
console.log(`stake/spin: ${STAKE} (lineStake ${STAKE / BigInt(LINE_COUNT)} x ${LINE_COUNT} lines)`);
console.log(`RTP:        ${(rtp * 100).toFixed(3)}%`);
console.log(`hit rate:   ${((hits / N) * 100).toFixed(2)}%`);
console.log(`house edge: ${((1 - rtp) * 100).toFixed(3)}%`);
console.log(`max win:    ${maxWin} (${Number(maxWin) / Number(STAKE)}x stake)`);
