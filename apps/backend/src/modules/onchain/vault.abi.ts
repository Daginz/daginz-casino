/**
 * Minimal CasinoVault ABI fragments the listener needs (viem-friendly).
 * Kept hand-written and tiny rather than importing the whole artifact, so the
 * backend has no build-time dependency on the contracts package.
 */
export const VAULT_ABI = [
  {
    type: 'event',
    name: 'Deposit',
    inputs: [
      { indexed: true, name: 'player', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'nonce', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'player', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'withdrawalId', type: 'bytes32' },
    ],
    outputs: [],
  },
] as const;
