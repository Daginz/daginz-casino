// Monte-Carlo RTP measurement for the 5×3 slot. Reimplements the spin/line/
// scatter math in plain JS (mirroring slot5x3.game.ts) so we can run millions
// of spins fast and tune the paytables to ~96% without booting Nest/ts-jest.
//
// Run: node apps/backend/scripts/slot5x3-calibrate.mjs [spins]

import { randomInt } from 'node:crypto';

const REELS = 5, ROWS = 3;

const STRIPS = [
  ['TEN','JACK','GEM','QUEEN','TEN','KING','ACE','WILD','JACK','CROWN','TEN','QUEEN','SCATTER','JACK','KING','TEN','ACE','QUEEN','GEM','JACK'],
  ['JACK','TEN','QUEEN','KING','JACK','GEM','TEN','ACE','WILD','QUEEN','JACK','CROWN','TEN','KING','SCATTER','QUEEN','JACK','ACE','TEN','GEM','KING'],
  ['TEN','QUEEN','JACK','ACE','KING','TEN','GEM','WILD','QUEEN','JACK','CROWN','TEN','KING','ACE','SCATTER','QUEEN','JACK','TEN','GEM','WILD','KING','ACE'],
  ['KING','TEN','JACK','QUEEN','ACE','TEN','GEM','JACK','WILD','KING','QUEEN','TEN','CROWN','JACK','ACE','SCATTER','TEN','QUEEN','KING','GEM','JACK'],
  ['TEN','JACK','QUEEN','TEN','KING','JACK','ACE','TEN','GEM','QUEEN','WILD','JACK','TEN','CROWN','KING','SCATTER','QUEEN','JACK','TEN','ACE','GEM','KING'],
];

const PAYLINES = [
  [1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],
  [0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[1,0,1,2,1],
  [1,2,1,0,1],[0,1,1,1,0],[2,1,1,1,2],[0,1,0,1,0],[2,1,2,1,2],
  [1,1,0,1,1],[1,1,2,1,1],[0,0,1,0,0],[2,2,1,2,2],[0,2,0,2,0],
];

const LINE_PAYTABLE = {
  TEN:   {3:5,4:15,5:52},   JACK:  {3:5,4:15,5:52},    QUEEN: {3:9,4:26,5:88},
  KING:  {3:12,4:33,5:130}, ACE:   {3:16,4:44,5:190},  GEM:   {3:25,4:75,5:350},
  CROWN: {3:30,4:120,5:600},
};
const SCATTER_PAYTABLE = {3:5,4:15,5:60};

function spin() {
  const grid = [];
  for (let reel = 0; reel < REELS; reel++) {
    const strip = STRIPS[reel];
    const stop = randomInt(strip.length);
    const col = [];
    for (let row = 0; row < ROWS; row++) col.push(strip[(stop + row - 1 + strip.length) % strip.length]);
    grid.push(col);
  }
  return grid;
}

function evalLine(cells) {
  const first = cells[0];
  if (!first || first === 'SCATTER') return 0;
  let paySym = first === 'WILD' ? null : first;
  let count = 0;
  for (const c of cells) {
    if (c === 'SCATTER') break;
    if (c === 'WILD') { count++; continue; }
    if (paySym === null) { paySym = c; count++; continue; }
    if (c === paySym) { count++; continue; }
    break;
  }
  const symbol = paySym ?? 'CROWN';
  if (count < 3) return 0;
  return LINE_PAYTABLE[symbol]?.[count] ?? 0;
}

const spins = Number(process.argv[2] ?? 2_000_000);
const lineBet = 1, lines = 20, totalBet = lineBet * lines;
let totalWagered = 0, totalPaid = 0, scatterHits = 0, lineHits = 0;

for (let s = 0; s < spins; s++) {
  const grid = spin();
  totalWagered += totalBet;
  for (let i = 0; i < lines; i++) {
    const cells = PAYLINES[i].map((row, reel) => grid[reel][row]);
    const m = evalLine(cells);
    if (m > 0) { totalPaid += lineBet * m; lineHits++; }
  }
  let scatters = 0;
  for (const col of grid) for (const c of col) if (c === 'SCATTER') scatters++;
  if (scatters >= 3) { totalPaid += totalBet * SCATTER_PAYTABLE[Math.min(scatters,5)]; scatterHits++; }
}

const rtp = totalPaid / totalWagered;
console.log(`spins:        ${spins.toLocaleString()}`);
console.log(`line hits:    ${lineHits.toLocaleString()} (${(100*lineHits/spins).toFixed(2)}% of spins had >=1 line, avg over 20 lines)`);
console.log(`scatter hits: ${scatterHits.toLocaleString()} (${(100*scatterHits/spins).toFixed(3)}%)`);
console.log(`RTP:          ${(rtp*100).toFixed(2)}%   (target 96%)`);
