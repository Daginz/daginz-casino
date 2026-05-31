// End-to-end game smoke: auth -> fund wallet (via direct ledger win on the Go
// service) -> list games -> play a slot round -> verify ledger debited/credited
// -> fetch history -> reveal seed -> verify the round's outcome reproduces.
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { SiweMessage } from 'siwe';
import { createHmac } from 'node:crypto';

const BACKEND = 'http://localhost:4000';
const WALLET = 'http://localhost:4100';

const j = async (url, opts) => {
  const r = await fetch(url, opts);
  return { status: r.status, body: r.status === 204 ? null : await r.json().catch(() => null) };
};

async function main() {
  const acct = privateKeyToAccount(generatePrivateKey());
  // auth
  const { body: ch } = await j(`${BACKEND}/auth/challenge`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address: acct.address }),
  });
  const msg = new SiweMessage({
    domain: 'localhost:3000', address: acct.address, statement: 'Sign in to Casino (testnet)',
    uri: 'http://localhost:3000', version: '1', chainId: 11155111, nonce: ch.nonce,
  }).prepareMessage();
  const signature = await acct.signMessage({ message: msg });
  const { body: auth } = await j(`${BACKEND}/auth/verify`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: msg, signature }),
  });
  const playerId = auth.player.id;
  const H = { authorization: `Bearer ${auth.accessToken}`, 'content-type': 'application/json' };

  // fund: credit 10000 directly into the ledger (testnet faucet equivalent)
  await j(`${WALLET}/ledger/win`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ playerId, amount: 10000, idempotencyKey: `faucet:${playerId}`, reference: 'faucet' }),
  });
  const { body: bal0 } = await j(`${WALLET}/ledger/${playerId}/balance`);
  console.log('balance after faucet:', bal0.amount);

  // list games
  const { body: games } = await j(`${BACKEND}/game/list`, { headers: H });
  console.log('games:', games);

  // play one slot round, stake 100
  const { status: ps, body: round } = await j(`${BACKEND}/game/play`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ gameId: 'slot-classic-3x3', stake: '100', params: {} }),
  });
  console.log('play status:', ps);
  if (ps !== 201 && ps !== 200) { console.error('play failed:', round); process.exit(1); }
  console.log('round: stake=%s payout=%s nonce=%s', round.stake, round.payout, round.nonce);
  console.log('grid:', JSON.stringify(round.detail.grid));
  console.log('wins:', JSON.stringify(round.detail.wins));

  // ledger reflects stake debit (and payout credit if any)
  const { body: bal1 } = await j(`${WALLET}/ledger/${playerId}/balance`);
  const expected = 10000 - 100 + Number(round.payout);
  const balanceOk = Number(bal1.amount) === expected;
  console.log(`balance: ${bal1.amount} (expected ${expected}) ->`, balanceOk ? 'OK' : 'MISMATCH');

  // history
  const { body: hist } = await j(`${BACKEND}/game/history`, { headers: H });
  console.log('history rows:', hist.length, 'first game:', hist[0]?.game);

  // reveal + verify the round reproduces from the revealed seed
  const { body: revealed } = await j(`${BACKEND}/provably-fair/reveal`, { method: 'POST', headers: H });
  const roundSeed = createHmac('sha256', revealed.serverSeed).update(`${round.clientSeed}:${round.nonce}`).digest('hex');
  // recompute the round's scalar outcome the same way the engine does
  const recomputed = parseInt(roundSeed.slice(0, 13), 16) / 2 ** 52;
  const outcomeOk = Math.abs(recomputed - round.outcome) < 1e-12;
  console.log('round outcome reproduces from revealed seed:', outcomeOk);

  const pass = (ps === 201 || ps === 200) && balanceOk && hist.length >= 1 && outcomeOk;
  console.log(pass ? 'GAME SMOKE: PASS' : 'GAME SMOKE: FAIL');
  if (!pass) process.exit(1);
}

main().catch((e) => { console.error('GAME SMOKE FAILED:', e); process.exit(1); });
