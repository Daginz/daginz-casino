import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE, account, buildSiweMessage } from '../lib/helpers.mjs';

/** Extract the dgz_refresh cookie value (with name) from a Set-Cookie header. */
function refreshCookie(res) {
  const sc = res.headers.get('set-cookie') ?? '';
  const m = sc.match(/dgz_refresh=([^;]+)/);
  return m ? `dgz_refresh=${m[1]}` : null;
}

async function verify() {
  const ch = await fetch(`${BASE}/auth/challenge`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address: account.address }),
  }).then((r) => r.json());
  const message = buildSiweMessage(ch.nonce, ch.issuedAt);
  const signature = await account.signMessage({ message });
  return fetch(`${BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message, signature }),
  });
}

test('Refresh: verify sets an HttpOnly refresh cookie and keeps it out of the body', async () => {
  const res = await verify();
  const body = await res.json();
  assert.ok(body.accessToken, 'access token in body');
  assert.equal(body.refreshToken, undefined, 'refresh token must NOT be in the JSON body');
  const sc = (res.headers.get('set-cookie') ?? '').toLowerCase();
  assert.match(sc, /dgz_refresh=/, 'refresh cookie set');
  assert.match(sc, /httponly/, 'refresh cookie is HttpOnly');
});

test('Refresh: rotates the cookie and rejects reuse of the old one', async () => {
  const v = await verify();
  const cookie1 = refreshCookie(v);
  assert.ok(cookie1, 'got initial refresh cookie');

  const r1 = await fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { cookie: cookie1 } });
  const r1body = await r1.json();
  assert.equal(r1.status, 201);
  assert.ok(r1body.accessToken, 'refresh returns a new access token');
  const cookie2 = refreshCookie(r1);
  assert.ok(cookie2 && cookie2 !== cookie1, 'refresh cookie was rotated');

  // Reusing the now-rotated token must be rejected (theft detection).
  const reuse = await fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { cookie: cookie1 } });
  assert.equal(reuse.status, 401, 'old refresh token is rejected after rotation');
});

test('Refresh: logout revokes the token so further refresh fails', async () => {
  const v = await verify();
  const cookie = refreshCookie(v);

  const lo = await fetch(`${BASE}/auth/logout`, { method: 'POST', headers: { cookie } });
  assert.ok(lo.status === 200 || lo.status === 201, 'logout succeeds');

  const after = await fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { cookie } });
  assert.equal(after.status, 401, 'refresh after logout is rejected');
});
