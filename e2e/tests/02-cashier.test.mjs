import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  signIn,
  api,
  faucet,
  walletChip,
  casinoBalance,
  depositOnchain,
  waitForCredit,
} from '../lib/helpers.mjs';

test('Faucet mints 1,000 CHIP on-chain to the wallet', async () => {
  const before = await walletChip();
  await faucet();
  const after = await walletChip();
  assert.equal(after, before + 1000, `expected +1000 CHIP, got ${before}→${after}`);
});

test('Deposit: on-chain deposit is credited to the ledger by the listener', async () => {
  const { token } = await signIn();
  // Make sure there are chips to deposit.
  if ((await walletChip()) < 200) await faucet();

  const ledgerBefore = await casinoBalance(token);
  const walletBefore = await walletChip();

  const { block } = await depositOnchain(200);
  assert.ok(block > 0, 'deposit mined in a block');

  // On-chain wallet dropped by the deposit amount.
  assert.equal(await walletChip(), walletBefore - 200, 'wallet CHIP decreased by 200');

  // The off-chain listener credits the ledger asynchronously. Assert it rose by
  // AT LEAST the deposit — the listener may also be crediting other pending
  // deposits from a shared dev account, so we test the delta, not an exact total.
  const ledgerAfter = await waitForCredit(token, ledgerBefore, 200);
  assert.ok(
    ledgerAfter >= ledgerBefore + 200,
    `ledger credited at least +200 (${ledgerBefore}→${ledgerAfter})`,
  );
});

test('Withdraw: ledger is debited and CHIP is released on-chain by the vault owner', async () => {
  const { token } = await signIn();

  // Ensure enough casino balance to withdraw.
  let ledger = await casinoBalance(token);
  if (ledger < 50) {
    if ((await walletChip()) < 100) await faucet();
    const before = ledger;
    await depositOnchain(100);
    ledger = await waitForCredit(token, before, 100);
  }

  const ledgerBefore = await casinoBalance(token);
  const walletBefore = await walletChip();

  const res = await api('/onchain/withdraw', { method: 'POST', token, body: { amount: '50' } });
  assert.equal(res.__status, 201, 'withdraw accepted');
  assert.ok(res.txHash, 'a real on-chain tx hash is returned');

  assert.equal(await casinoBalance(token), ledgerBefore - 50, 'ledger debited by exactly 50');

  // The owner-sent release tx credits the wallet on-chain — poll for it.
  let walletAfter = walletBefore;
  for (let i = 0; i < 12 && walletAfter < walletBefore + 50; i += 1) {
    await new Promise((r) => setTimeout(r, 1000));
    walletAfter = await walletChip();
  }
  assert.ok(walletAfter >= walletBefore + 50, `wallet CHIP increased by ≥50 (${walletBefore}→${walletAfter})`);
});

test('Withdraw over balance is rejected (no overdraft)', async () => {
  const { token } = await signIn();
  const ledger = await casinoBalance(token);
  const res = await api('/onchain/withdraw', { method: 'POST', token, body: { amount: String(ledger + 1_000_000) } });
  assert.notEqual(res.__status, 201, 'over-balance withdraw must not succeed');
});
