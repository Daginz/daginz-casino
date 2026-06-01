import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  signIn,
  api,
  faucet,
  casinoBalance,
  walletChip,
  depositOnchain,
  waitForCredit,
  GAME_ID,
  hmacSha256Hex,
  sha256Hex,
  roundOutcome,
} from '../lib/helpers.mjs';

/** Ensure the casino balance is at least `min`, depositing if needed. */
async function ensureBalance(token, min) {
  let bal = await casinoBalance(token);
  if (bal >= min) return bal;
  if ((await walletChip()) < min) await faucet();
  const before = bal;
  await depositOnchain(min);
  return waitForCredit(token, before, min);
}

test('Spin: stake is debited and a valid 3×3 grid + win lines are returned', async () => {
  const { token } = await signIn();
  await ensureBalance(token, 100);

  const before = await casinoBalance(token);
  const round = await api('/game/play', { method: 'POST', token, body: { gameId: GAME_ID, stake: '10', params: {} } });

  assert.equal(round.__status, 201, 'spin accepted');
  assert.ok(round.id, 'round id returned');
  // grid is 3 columns × 3 rows.
  assert.equal(round.detail.grid.length, 3);
  for (const col of round.detail.grid) assert.equal(col.length, 3);

  const after = await casinoBalance(token);
  const expected = before - 10 + Number(round.payout);
  assert.equal(after, expected, `balance reflects -stake +payout (${before}→${after}, payout ${round.payout})`);

  // Any reported win line must actually be three-of-a-kind on the grid.
  for (const w of round.detail.wins) {
    const PAYLINES = [[0, 0, 0], [1, 1, 1], [2, 2, 2], [0, 1, 2], [2, 1, 0]];
    const line = PAYLINES[w.line];
    const cells = line.map((row, col) => round.detail.grid[col][row]);
    const nonWild = cells.filter((c) => c !== 'WILD');
    const allSame = nonWild.every((c) => c === nonWild[0]);
    assert.ok(allSame, `win line ${w.line} is genuinely a line: ${cells.join(',')}`);
  }
});

test('Many spins keep the ledger consistent (sum of -stake +payout)', async () => {
  const { token } = await signIn();
  await ensureBalance(token, 300);

  let expected = await casinoBalance(token);
  for (let i = 0; i < 15; i += 1) {
    const r = await api('/game/play', { method: 'POST', token, body: { gameId: GAME_ID, stake: '10', params: {} } });
    assert.equal(r.__status, 201);
    expected = expected - 10 + Number(r.payout);
  }
  assert.equal(await casinoBalance(token), expected, 'ledger matches the running stake/payout sum exactly');
});

test('Provably fair: the outcome recomputes byte-for-byte in the "browser"', async () => {
  const { token } = await signIn();
  await ensureBalance(token, 50);

  // Pin a known client seed so the commitment is fresh and predictable.
  await api('/provably-fair/rotate', { method: 'POST', token, body: { clientSeed: 'e2e-verify-seed' } });

  const round = await api('/game/play', { method: 'POST', token, body: { gameId: GAME_ID, stake: '10', params: {} } });
  assert.equal(round.__status, 201);

  const reveal = await api('/provably-fair/reveal', { method: 'POST', token });
  assert.ok(reveal.serverSeed, 'server seed revealed');

  // 1) The revealed seed hashes to the pre-published commitment.
  const computedHash = await sha256Hex(reveal.serverSeed);
  assert.equal(computedHash.toLowerCase(), round.serverSeedHash.toLowerCase(), 'SHA-256(serverSeed) === committed hash');

  // 2) Recomputing the outcome with the same HMAC math matches what was paid.
  const roundSeed = await hmacSha256Hex(reveal.serverSeed, `${round.clientSeed}:${round.nonce}`);
  const outcome = roundOutcome(roundSeed);
  assert.ok(Math.abs(outcome - round.outcome) < 1e-9, `recomputed outcome ${outcome} === backend ${round.outcome}`);

  // 3) The backend's public verify endpoint agrees.
  const v = await api('/provably-fair/verify', {
    method: 'POST',
    body: {
      serverSeed: reveal.serverSeed,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      nonce: round.nonce,
      outcome: round.outcome,
    },
  });
  assert.equal(v.valid, true, 'backend /provably-fair/verify confirms the draw');
});

test('Provably fair: a tampered outcome fails verification', async () => {
  const { token } = await signIn();
  await ensureBalance(token, 20);
  await api('/provably-fair/rotate', { method: 'POST', token, body: { clientSeed: 'e2e-tamper-seed' } });
  const round = await api('/game/play', { method: 'POST', token, body: { gameId: GAME_ID, stake: '10', params: {} } });
  const reveal = await api('/provably-fair/reveal', { method: 'POST', token });

  const v = await api('/provably-fair/verify', {
    method: 'POST',
    body: {
      serverSeed: reveal.serverSeed,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      nonce: round.nonce,
      outcome: round.outcome + 0.1234, // tampered
    },
  });
  assert.equal(v.valid, false, 'a tampered outcome must not verify');
});
