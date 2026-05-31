// Provably-fair lifecycle smoke test:
// auth (SIWE) -> commitment (hash) -> draw twice (nonce 0,1) -> reveal ->
// verify each draw locally AND via the public /verify endpoint.
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { SiweMessage } from 'siwe';
import { createHmac, createHash } from 'node:crypto';

const BASE = process.env.BASE ?? 'http://localhost:4000';

function localOutcome(serverSeed, clientSeed, nonce) {
  const d = createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
  return parseInt(d.slice(0, 13), 16) / 2 ** 52;
}

async function jsonFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, body };
}

async function main() {
  const account = privateKeyToAccount(generatePrivateKey());
  const address = account.address;

  // auth
  const { body: ch } = await jsonFetch('/auth/challenge', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  const siwe = new SiweMessage({
    domain: 'localhost:3000', address, statement: 'Sign in to Casino (testnet)',
    uri: 'http://localhost:3000', version: '1', chainId: 11155111, nonce: ch.nonce,
  });
  const message = siwe.prepareMessage();
  const signature = await account.signMessage({ message });
  const { body: auth } = await jsonFetch('/auth/verify', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message, signature }),
  });
  const authH = { authorization: `Bearer ${auth.accessToken}`, 'content-type': 'application/json' };

  // commitment
  const { body: commit } = await jsonFetch('/provably-fair/commitment', { headers: authH });
  console.log('commitment:', commit);

  // two draws via the game stub (which calls pf.draw) — capture outcome+nonce
  const draws = [];
  for (let i = 0; i < 2; i++) {
    const { body } = await jsonFetch('/game/bet', {
      method: 'POST', headers: authH,
      body: JSON.stringify({ game: 'dice', amount: '0', clientSeed: 'ignored', params: { target: 50 } }),
    });
    if (body?.outcome === undefined) { console.error('draw failed, body:', body); process.exit(1); }
    draws.push({ nonce: body.nonce, outcome: body.outcome, hash: body.serverSeedHash });
    console.log(`draw ${i}: nonce=${body.nonce} outcome=${body.outcome}`);
  }

  const nonceIncrements = draws[0].nonce === 0 && draws[1].nonce === 1;
  console.log('nonce increments 0->1:', nonceIncrements);

  // reveal
  const { body: revealed } = await jsonFetch('/provably-fair/reveal', { method: 'POST', headers: authH });
  console.log('revealed serverSeed:', revealed.serverSeed?.slice(0, 16) + '...');

  // hash of revealed serverSeed must equal committed hash
  const hashMatches = createHash('sha256').update(revealed.serverSeed).digest('hex') === commit.serverSeedHash;
  console.log('revealed hash matches commitment:', hashMatches);

  // verify each draw: locally recomputed AND via public endpoint
  let allValid = true;
  for (const d of draws) {
    const localOk = Math.abs(localOutcome(revealed.serverSeed, revealed.clientSeed, d.nonce) - d.outcome) < 1e-12;
    const { body: v } = await jsonFetch('/provably-fair/verify', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        serverSeed: revealed.serverSeed, serverSeedHash: revealed.serverSeedHash,
        clientSeed: revealed.clientSeed, nonce: d.nonce, outcome: d.outcome,
      }),
    });
    console.log(`verify nonce=${d.nonce}: local=${localOk} endpoint=${v.valid}`);
    allValid = allValid && localOk && v.valid === true;
  }

  // tamper check: wrong outcome must fail verification
  const { body: bad } = await jsonFetch('/provably-fair/verify', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      serverSeed: revealed.serverSeed, serverSeedHash: revealed.serverSeedHash,
      clientSeed: revealed.clientSeed, nonce: 0, outcome: 0.999999,
    }),
  });
  console.log('tampered outcome rejected:', bad.valid === false);

  const pass = nonceIncrements && hashMatches && allValid && bad.valid === false;
  console.log(pass ? 'PF SMOKE: PASS' : 'PF SMOKE: FAIL');
  if (!pass) process.exit(1);
}

main().catch((e) => { console.error('PF SMOKE FAILED:', e); process.exit(1); });
