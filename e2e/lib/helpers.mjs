/**
 * Shared helpers for the E2E suite. These talk to the SAME endpoints and
 * contracts the real frontend uses, so a green run proves the whole testnet
 * vertical works: SIWE auth, on-chain faucet/deposit, the off-chain listener,
 * the provably-fair game, and owner-signed withdrawals.
 */
import { SiweMessage } from 'siwe';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, createPublicClient, http, parseUnits, formatUnits } from 'viem';

export const BASE = process.env.E2E_API_URL ?? 'http://localhost:4000';
export const RPC = process.env.E2E_RPC_URL ?? 'http://localhost:8545';
export const CHIP = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
export const VAULT = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
export const GAME_ID = 'slot-classic-3x3';

// Well-known Hardhat dev account #1 (testnet only, public key — no real value).
export const DEMO_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

export const hardhat = {
  id: 31337,
  name: 'Hardhat',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
};

export const CHIP_ABI = [
  { type: 'function', name: 'faucet', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'a', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{ name: 'o', type: 'address' }, { name: 's', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 's', type: 'address' }, { name: 'a', type: 'uint256' }], outputs: [{ type: 'bool' }] },
];
export const VAULT_ABI = [
  { type: 'function', name: 'deposit', stateMutability: 'nonpayable', inputs: [{ name: 'a', type: 'uint256' }], outputs: [] },
];

export const account = privateKeyToAccount(DEMO_KEY);
export const publicClient = createPublicClient({ chain: hardhat, transport: http(RPC) });
export const walletClient = createWalletClient({ account, chain: hardhat, transport: http(RPC) });

/** Build the SIWE message exactly as the frontend does (ASCII statement!). */
export function buildSiweMessage(nonce, issuedAt) {
  return new SiweMessage({
    domain: 'localhost:3000',
    address: account.address,
    statement: 'Sign in to Daginz, a provably-fair slot on testnet.',
    uri: 'http://localhost:3000',
    version: '1',
    chainId: 31337,
    nonce,
    issuedAt,
  }).prepareMessage();
}

/** Full SIWE handshake → returns { token, player }. */
export async function signIn() {
  const ch = await api('/auth/challenge', { method: 'POST', body: { address: account.address } });
  const message = buildSiweMessage(ch.nonce, ch.issuedAt);
  const signature = await account.signMessage({ message });
  const res = await api('/auth/verify', { method: 'POST', body: { message, signature } });
  return { token: res.accessToken, player: res.player, message, signature };
}

/** Thin fetch wrapper returning parsed JSON, with optional bearer token. */
export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  return Object.assign(json ?? {}, { __status: res.status });
}

/** Off-chain ledger (casino) balance in whole CHIP. */
export async function casinoBalance(token) {
  const r = await api('/wallet/balance', { token });
  return r.__status === 200 ? Number(r.amount) : -1;
}

/** On-chain CHIP balance of the demo account (whole CHIP). */
export async function walletChip() {
  const wei = await publicClient.readContract({ address: CHIP, abi: CHIP_ABI, functionName: 'balanceOf', args: [account.address] });
  return Number(formatUnits(wei, 18));
}

export async function faucet() {
  const hash = await walletClient.writeContract({ address: CHIP, abi: CHIP_ABI, functionName: 'faucet', args: [] });
  await publicClient.waitForTransactionReceipt({ hash });
}

/** approve (if needed) + deposit `whole` CHIP into the vault on-chain. */
export async function depositOnchain(whole) {
  const amt = parseUnits(String(whole), 18);
  const allowance = await publicClient.readContract({ address: CHIP, abi: CHIP_ABI, functionName: 'allowance', args: [account.address, VAULT] });
  if (allowance < amt) {
    const ah = await walletClient.writeContract({ address: CHIP, abi: CHIP_ABI, functionName: 'approve', args: [VAULT, amt] });
    await publicClient.waitForTransactionReceipt({ hash: ah });
  }
  const dh = await walletClient.writeContract({ address: VAULT, abi: VAULT_ABI, functionName: 'deposit', args: [amt] });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: dh });
  return { hash: dh, block: Number(receipt.blockNumber) };
}

/** Poll the ledger until it rises by ≥ `delta` above `before`, or time out. */
export async function waitForCredit(token, before, delta, tries = 15) {
  for (let i = 0; i < tries; i += 1) {
    await sleep(1500);
    const now = await casinoBalance(token);
    if (now >= before + delta) return now;
  }
  return casinoBalance(token);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Browser-side provably-fair recompute (mirror of the frontend) ──────────
function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export async function hmacSha256Hex(key, msg) {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}
export async function sha256Hex(input) {
  const enc = new TextEncoder();
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(input)));
}
export function roundOutcome(roundSeed) {
  return parseInt(roundSeed.slice(0, 13), 16) / 2 ** 52;
}
