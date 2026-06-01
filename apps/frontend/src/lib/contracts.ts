/**
 * On-chain contract addresses + the minimal ABIs the frontend calls directly
 * via wagmi/viem: ChipToken (faucet / approve / balanceOf / allowance) and
 * CasinoVault (deposit). Withdrawals go through the backend (owner-signed), not
 * from the browser, so the vault's withdraw fn is intentionally absent here.
 *
 * Addresses default to the local Hardhat deployment (deployments.local.json)
 * and are overridable via NEXT_PUBLIC_* env for Sepolia.
 */
import type { Address } from 'viem';

export const CHIP_ADDRESS = (process.env.NEXT_PUBLIC_CHIP_TOKEN_ADDRESS ??
  '0x5FbDB2315678afecb367f032d93F642f64180aa3') as Address;

export const VAULT_ADDRESS = (process.env.NEXT_PUBLIC_VAULT_ADDRESS ??
  '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512') as Address;

/** CHIP is an 18-decimal ERC-20 on-chain; the ledger stores whole CHIP. */
export const CHIP_DECIMALS = 18;

export const CHIP_ABI = [
  {
    type: 'function',
    name: 'faucet',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export const VAULT_ABI = [
  {
    type: 'function',
    name: 'deposit',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'event',
    name: 'Deposit',
    inputs: [
      { indexed: true, name: 'player', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'nonce', type: 'uint256' },
    ],
  },
] as const;
