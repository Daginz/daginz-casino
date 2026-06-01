// Full hybrid cycle (Block F-4), using viem (no ethers dependency):
//   on-chain deposit -> listener credits ledger -> play slot rounds ->
//   request withdraw -> backend debits ledger + releases CHIP on-chain ->
//   reconcile ledger AND on-chain CHIP balance.
//
// Requires: hardhat node + deployed contracts, Go wallet :4100, backend :4000
// (ONCHAIN_ENABLED=true). Player = hardhat account #1 (well-known testnet key).
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
  getContract,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SiweMessage } from 'siwe';
import { readFileSync } from 'node:fs';

const BACKEND = 'http://localhost:4000';
const WALLET = 'http://localhost:4100';
const RPC = 'http://127.0.0.1:8545';
const CHAIN_ID = 31337;

const PLAYER_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const dep = JSON.parse(readFileSync('../contracts-evm/deployments.local.json', 'utf8'));

const CHIP_ABI = [
  { type: 'function', name: 'faucet', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  {
    type: 'function', name: 'approve', stateMutability: 'nonpayable',
    inputs: [{ name: 's', type: 'address' }, { name: 'a', type: 'uint256' }],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function', name: 'balanceOf', stateMutability: 'view',
    inputs: [{ name: 'o', type: 'address' }], outputs: [{ type: 'uint256' }],
  },
];
const VAULT_ABI = [
  { type: 'function', name: 'deposit', stateMutability: 'nonpayable', inputs: [{ name: 'a', type: 'uint256' }], outputs: [] },
];

const chain = { id: CHAIN_ID, name: 'local', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [RPC] } } };
const account = privateKeyToAccount(PLAYER_KEY);
const pub = createPublicClient({ chain, transport: http(RPC) });
const wclient = createWalletClient({ account, chain, transport: http(RPC) });

const j = async (url, opts) => {
  const r = await fetch(url, opts);
  return { status: r.status, body: r.status === 204 ? null : await r.json().catch(() => null) };
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chipBal = async () =>
  Number(formatEther(await pub.readContract({ address: dep.chip, abi: CHIP_ABI, functionName: 'balanceOf', args: [account.address] })));
const send = async (address, abi, functionName, args) => {
  const hash = await wclient.writeContract({ address, abi, functionName, args });
  await pub.waitForTransactionReceipt({ hash });
};

async function main() {
  const addr = account.address.toLowerCase();
  console.log('player:', addr);

  // AUTH (SIWE)
  const { body: ch } = await j(`${BACKEND}/auth/challenge`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address: account.address }),
  });
  const msg = new SiweMessage({
    domain: 'localhost:3000', address: account.address, statement: 'Sign in to Casino (testnet)',
    uri: 'http://localhost:3000', version: '1', chainId: CHAIN_ID, nonce: ch.nonce,
  }).prepareMessage();
  const signature = await account.signMessage({ message: msg });
  const { body: auth } = await j(`${BACKEND}/auth/verify`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: msg, signature }),
  });
  const H = { authorization: `Bearer ${auth.accessToken}`, 'content-type': 'application/json' };

  // ON-CHAIN DEPOSIT 500 CHIP
  await send(dep.chip, CHIP_ABI, 'faucet', []);
  await send(dep.chip, CHIP_ABI, 'approve', [dep.vault, parseEther('500')]);
  await send(dep.vault, VAULT_ABI, 'deposit', [parseEther('500')]);
  console.log('deposited 500 CHIP on-chain');

  let credited = 0;
  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    const { body } = await j(`${WALLET}/ledger/${addr}/balance`);
    credited = Number(body.amount);
    if (credited >= 500) break;
  }
  console.log('ledger after deposit:', credited, '(expect 500)');

  // PLAY 10x50 SLOT
  let staked = 0, won = 0;
  for (let i = 0; i < 10; i++) {
    const { status, body } = await j(`${BACKEND}/game/play`, {
      method: 'POST', headers: H,
      body: JSON.stringify({ gameId: 'slot-classic-3x3', stake: '50', params: {} }),
    });
    if (status !== 201 && status !== 200) {
      throw new Error(`game/play round ${i} failed: ${status} ${JSON.stringify(body)}`);
    }
    staked += 50; won += Number(body.payout);
  }
  const ledgerAfterPlay = Number((await j(`${WALLET}/ledger/${addr}/balance`)).body.amount);
  const expectedAfterPlay = 500 - staked + won;
  console.log(`played 10x50: staked ${staked} won ${won} -> ledger ${ledgerAfterPlay} (expect ${expectedAfterPlay})`);

  // WITHDRAW: take whatever the player actually has (variable due to RNG),
  // capped so the test never tries to over-withdraw. Withdraw the full balance.
  const withdrawAmt = ledgerAfterPlay; // whole current balance
  const onchainPre = await chipBal();
  const { status: ws, body: wres } = await j(`${BACKEND}/onchain/withdraw`, {
    method: 'POST', headers: H, body: JSON.stringify({ amount: String(withdrawAmt) }),
  });
  console.log('withdraw', withdrawAmt, 'status:', ws, 'tx:', wres?.txHash?.slice(0, 14));

  let onchainAfter = onchainPre;
  for (let i = 0; i < 12; i++) {
    await sleep(800);
    onchainAfter = await chipBal();
    if (onchainAfter >= onchainPre + withdrawAmt) break;
  }
  const ledgerFinal = Number((await j(`${WALLET}/ledger/${addr}/balance`)).body.amount);

  console.log(`on-chain CHIP: ${onchainPre} -> ${onchainAfter} (+${onchainAfter - onchainPre}, expect +${withdrawAmt})`);
  console.log(`ledger final: ${ledgerFinal} (expect 0)`);

  const depositOk = credited === 500;
  const playOk = ledgerAfterPlay === expectedAfterPlay;
  const withdrawOnchainOk = onchainAfter - onchainPre === withdrawAmt;
  const ledgerReconciled = ledgerFinal === ledgerAfterPlay - withdrawAmt;
  const pass = depositOk && playOk && withdrawOnchainOk && ledgerReconciled;

  console.log('---');
  console.log('deposit credited :', depositOk);
  console.log('play reconciled  :', playOk);
  console.log('withdraw on-chain:', withdrawOnchainOk);
  console.log('ledger final ok  :', ledgerReconciled);
  console.log(pass ? 'F4 CYCLE: PASS' : 'F4 CYCLE: FAIL');
  if (!pass) process.exitCode = 1;
}

main().catch((e) => { console.error('F4 FAILED:', e); process.exitCode = 1; });
