// Real SIWE smoke test: generate a wallet, get a nonce, build + sign an
// EIP-4361 message, verify it, then call /auth/me with the JWT.
// Run: node scripts/siwe-smoke.mjs
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { SiweMessage } from 'siwe';

const BASE = process.env.BASE ?? 'http://localhost:4000';
const DOMAIN = 'localhost:3000';
const URI = 'http://localhost:3000';

const pk = generatePrivateKey();
const account = privateKeyToAccount(pk);
const address = account.address;

async function main() {
  // 1. challenge
  const chRes = await fetch(`${BASE}/auth/challenge`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  const { nonce } = await chRes.json();
  console.log('nonce:', nonce);

  // 2. build SIWE message + sign
  const siwe = new SiweMessage({
    domain: DOMAIN,
    address,
    statement: 'Sign in to Casino (testnet)',
    uri: URI,
    version: '1',
    chainId: 11155111,
    nonce,
  });
  const message = siwe.prepareMessage();
  const signature = await account.signMessage({ message });

  // 3. verify
  const vRes = await fetch(`${BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message, signature }),
  });
  const verified = await vRes.json();
  console.log('verify status:', vRes.status);
  console.log('player:', verified.player);
  console.log('token present:', Boolean(verified.accessToken));

  // 4. /auth/me with JWT
  const meRes = await fetch(`${BASE}/auth/me`, {
    headers: { authorization: `Bearer ${verified.accessToken}` },
  });
  console.log('me status:', meRes.status);
  console.log('me:', await meRes.json());

  // 5. replay verify (same nonce) must fail
  const replay = await fetch(`${BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message, signature }),
  });
  console.log('replay status (expect 401):', replay.status);

  console.log('ADDRESS_USED:', address.toLowerCase());
}

main().catch((e) => {
  console.error('SMOKE FAILED:', e);
  process.exit(1);
});
