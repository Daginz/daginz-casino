/**
 * SIWE (EIP-4361) sign-in against the casino backend.
 *
 * Flow: POST /auth/challenge → build a SiweMessage embedding the nonce →
 * sign it (MetaMask, or a local demo key) → POST /auth/verify → store JWT.
 *
 * Demo mode signs with a deterministic local private key via viem, so it still
 * authenticates against the REAL backend and gets a real ledger identity — no
 * MetaMask required, but no mocking either.
 */
import { SiweMessage } from 'siwe';
import { privateKeyToAccount } from 'viem/accounts';
import type { Address, Hex } from 'viem';
import { api, setToken, type SiweChallenge, type VerifyResult } from './api';
import { ACTIVE_CHAIN_ID } from './wagmi';

/** A deterministic demo account (well-known Hardhat key #1). Testnet only. */
const DEMO_PRIVATE_KEY: Hex = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
export const demoAccount = privateKeyToAccount(DEMO_PRIVATE_KEY);

export interface SiweSignerInput {
  address: Address;
  chainId: number;
  /** Produce a signature for the given SIWE message string. */
  signMessage: (message: string) => Promise<Hex>;
}

/** Build the SIWE message the backend's `new SiweMessage(...).verify()` expects. */
function buildSiweMessage(address: Address, chainId: number, nonce: string, issuedAt: string): string {
  const domain = typeof window !== 'undefined' ? window.location.host : 'localhost';
  const uri = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const message = new SiweMessage({
    domain,
    address,
    // ASCII only: the SIWE ABNF parser rejects non-ASCII (e.g. em-dash) in the
    // statement line, which would break the backend's round-trip re-parse.
    statement: 'Sign in to Daginz, a provably-fair slot on testnet.',
    uri,
    version: '1',
    chainId,
    nonce,
    issuedAt,
  });
  return message.prepareMessage();
}

/**
 * Runs the full challenge→sign→verify handshake. Returns the authenticated
 * player + stores the JWT for subsequent requests. Throws ApiError on failure.
 */
export async function signIn(signer: SiweSignerInput): Promise<VerifyResult> {
  const challenge = await api.post<SiweChallenge>('/auth/challenge', { address: signer.address });
  const message = buildSiweMessage(signer.address, signer.chainId, challenge.nonce, challenge.issuedAt);
  const signature = await signer.signMessage(message);
  const result = await api.post<VerifyResult>('/auth/verify', { message, signature });
  setToken(result.accessToken);
  return result;
}

/** Demo sign-in: sign locally with the demo key, no wallet UI. */
export async function signInDemo(): Promise<VerifyResult> {
  return signIn({
    address: demoAccount.address,
    chainId: ACTIVE_CHAIN_ID,
    signMessage: (message) => demoAccount.signMessage({ message }),
  });
}

export function signOut(): void {
  setToken(null);
}
