import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE, signIn, api, casinoBalance, GAME_ID } from '../lib/helpers.mjs';

/**
 * Bonus economy: daily reward grants free spins, double-claim is blocked by the
 * 24h cooldown, and a free spin pays for a round INSTEAD of the ledger balance
 * (the engine stays stateless — only the bet source changes). A win still
 * credits the real ledger.
 *
 * NOTE: the daily claim is once-per-24h per player; the suite uses one shared
 * demo account, so these assertions tolerate "already claimed" from a prior run
 * by reading the free-spin count rather than requiring a fresh claim.
 */
test('Bonus: daily claim grants free spins (or is on cooldown), double-claim is 409', async () => {
  const { token } = await signIn();

  const status = await api('/bonus', { token });
  assert.equal(status.__status, 200);
  assert.ok(typeof status.freeSpins === 'number', 'status reports a free-spin count');

  const claim = await api('/bonus/daily/claim', { method: 'POST', token });
  if (claim.__status === 201 || claim.__status === 200) {
    assert.ok(claim.freeSpins >= 10, 'a fresh claim grants >=10 free spins');
    // Immediately claiming again must hit the cooldown.
    const again = await api('/bonus/daily/claim', { method: 'POST', token });
    assert.equal(again.__status, 409, 'second daily claim is rejected on cooldown');
  } else {
    // Already claimed in a prior run — must be the cooldown error.
    assert.equal(claim.__status, 409, 'repeat claim within 24h is 409');
  }
});

test('Bonus: a free spin pays for the round instead of the ledger', async () => {
  const { token } = await signIn();

  // Make sure there's at least one free spin (claim if available).
  let status = await api('/bonus', { token });
  if (status.freeSpins === 0) {
    await api('/bonus/daily/claim', { method: 'POST', token });
    status = await api('/bonus', { token });
  }
  if (status.freeSpins === 0) {
    // Nothing to test this run (cooldown + drained). Skip rather than fail.
    return;
  }

  const ledgerBefore = await casinoBalance(token);
  const round = await api('/game/play', {
    method: 'POST',
    token,
    body: { gameId: GAME_ID, stake: '10', params: {}, useFreeSpin: true },
  });
  assert.equal(round.__status, 201, 'free-spin round accepted');

  const after = await api('/bonus', { token });
  assert.equal(after.freeSpins, status.freeSpins - 1, 'exactly one free spin was consumed');

  // The stake was NOT debited from the ledger — only the payout (if any) credited.
  const ledgerAfter = await casinoBalance(token);
  assert.equal(
    ledgerAfter,
    ledgerBefore + Number(round.payout),
    'ledger changed by +payout only (stake not debited)',
  );
});
