import { test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Ledger rollback is a Go-service concern (compensating double-entry). We hit
 * the ledger directly (:4100) since the backend uses it internally for
 * stuck-op recovery. A unique player per run keeps the suite re-runnable.
 */
const LEDGER = process.env.E2E_LEDGER_URL ?? 'http://localhost:4100';

async function post(path, body) {
  const res = await fetch(`${LEDGER}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}
async function balance(player) {
  const r = await fetch(`${LEDGER}/ledger/${player}/balance`);
  return (await r.json()).amount;
}

test('Rollback: a compensating entry restores the balance, idempotently', async () => {
  const p = `e2e-rb-${Date.now()}`;

  await post('/ledger/win', { playerId: p, amount: 100, idempotencyKey: `w-${p}`, reference: 'seed' });
  const afterBet = await post('/ledger/bet', { playerId: p, amount: 30, idempotencyKey: `b-${p}`, reference: 'round' });
  assert.equal(afterBet.body.amount, 70, 'balance is 70 after the bet');

  const rb1 = await post('/ledger/rollback', { idempotencyKey: `b-${p}` });
  assert.equal(rb1.status, 200);
  assert.equal(rb1.body.amount, 100, 'rolling back the bet restores 100');

  // Second rollback of the same op must not credit again.
  const rb2 = await post('/ledger/rollback', { idempotencyKey: `b-${p}` });
  assert.equal(rb2.body.amount, 100, 'double rollback is idempotent');

  assert.equal(await balance(p), 100, 'final balance is 100');
});

test('Rollback: an unknown idempotency key is rejected', async () => {
  const rb = await post('/ledger/rollback', { idempotencyKey: `nope-${Date.now()}` });
  assert.notEqual(rb.status, 200, 'rolling back a non-existent op must not succeed');
});
