import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, signIn, buildSiweMessage, account } from '../lib/helpers.mjs';

test('SIWE: challenge → sign → verify issues a JWT for the wallet address', async () => {
  const { token, player } = await signIn();
  assert.ok(token, 'access token returned');
  assert.equal(player.walletAddress.toLowerCase(), account.address.toLowerCase());
  // The ledger player id is the lowercased address (single identity).
  assert.equal(player.id, account.address.toLowerCase());
});

test('SIWE: the JWT authenticates /auth/me', async () => {
  const { token } = await signIn();
  const me = await api('/auth/me', { token });
  assert.equal(me.__status, 200);
  assert.equal(me.address.toLowerCase(), account.address.toLowerCase());
});

test('SIWE: a nonce cannot be replayed (second verify is rejected)', async () => {
  const ch = await api('/auth/challenge', { method: 'POST', body: { address: account.address } });
  const message = buildSiweMessage(ch.nonce, ch.issuedAt);
  const signature = await account.signMessage({ message });

  const first = await api('/auth/verify', { method: 'POST', body: { message, signature } });
  assert.ok(first.accessToken, 'first verify succeeds');

  const second = await api('/auth/verify', { method: 'POST', body: { message, signature } });
  assert.equal(second.__status, 401, 'replayed nonce is rejected');
});

test('Auth: a protected route refuses requests without a token', async () => {
  const res = await api('/wallet/balance');
  assert.equal(res.__status, 401);
});
