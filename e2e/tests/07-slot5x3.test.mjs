import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signIn, api, casinoBalance, faucet, walletChip, depositOnchain, waitForCredit } from '../lib/helpers.mjs';

const GAME = 'slot-5x3-20line';
const LINE_BET = 10;
const LINES = 20;
const STAKE = String(LINE_BET * LINES); // 200

async function ensureBalance(token, min) {
  let bal = await casinoBalance(token);
  if (bal >= min) return bal;
  if ((await walletChip()) < min) await faucet();
  const before = bal;
  await depositOnchain(min);
  return waitForCredit(token, before, min);
}

test('Slot 5×3 is registered alongside the 3×3 game', async () => {
  const list = await api('/game/list');
  const ids = (Array.isArray(list) ? list : []).map((g) => g.id);
  assert.ok(ids.includes(GAME), '5×3 slot is registered');
});

test('Slot 5×3: spins return a 5×3 grid and conserve the ledger', async () => {
  const { token } = await signIn();
  await ensureBalance(token, 2000);

  for (let i = 0; i < 20; i += 1) {
    const before = await casinoBalance(token);
    const round = await api('/game/play', {
      method: 'POST',
      token,
      body: { gameId: GAME, stake: STAKE, params: { lineBet: LINE_BET, lines: LINES } },
    });
    assert.equal(round.__status, 201, 'spin accepted');
    assert.equal(round.detail.grid.length, 5, 'grid has 5 reels');
    for (const reel of round.detail.grid) assert.equal(reel.length, 3, 'each reel has 3 rows');

    // payout = sum of line wins + scatter win; balance moves by -stake +payout.
    const after = await casinoBalance(token);
    assert.equal(after, before - 200 + Number(round.payout), 'ledger conserved this round');
  }
});

test('Slot 5×3: validation rejects out-of-range params', async () => {
  const { token } = await signIn();
  const bad = await api('/game/play', {
    method: 'POST',
    token,
    body: { gameId: GAME, stake: STAKE, params: { lineBet: 999999, lines: 20 } },
  });
  assert.notEqual(bad.__status, 201, 'an over-max line bet is rejected');
});
