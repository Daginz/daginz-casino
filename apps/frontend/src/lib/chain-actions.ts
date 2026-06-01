/**
 * On-chain write actions (faucet / approve / deposit) abstracted over the two
 * wallet modes:
 *  - MetaMask: the caller passes wagmi's writeContractAsync + a wait fn.
 *  - Demo: we build a viem wallet client with the demo key against the local
 *    RPC and send directly. Same contracts, same chain — no mocking.
 *
 * Withdrawals are NOT here: they go through the backend (POST /onchain/withdraw),
 * which owns the vault and signs the release.
 */
import { createWalletClient, createPublicClient, http, parseUnits, type Address, type Hash } from 'viem';
import { demoAccount } from './auth';
import { hardhat } from './wagmi';
import { CHIP_ABI, CHIP_ADDRESS, CHIP_DECIMALS, VAULT_ABI, VAULT_ADDRESS } from './contracts';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? 'http://127.0.0.1:8545';

const publicClient = createPublicClient({ chain: hardhat, transport: http(RPC_URL) });

/** Demo wallet client — sends real txs as the demo account on the local chain. */
const demoWalletClient = createWalletClient({ account: demoAccount, chain: hardhat, transport: http(RPC_URL) });

/** A writer abstracts "send this contract call and resolve when mined". */
export interface ChainWriter {
  faucet: () => Promise<Hash>;
  approve: (amount: bigint) => Promise<Hash>;
  deposit: (amount: bigint) => Promise<Hash>;
  chipBalance: (owner: Address) => Promise<bigint>;
  allowance: (owner: Address) => Promise<bigint>;
  /** Wait for the tx to be mined; resolves with its block number. */
  waitForTx: (hash: Hash) => Promise<{ blockNumber: number }>;
}

/** Convert a whole-CHIP UI amount to on-chain wei (18 decimals). */
export function chipToWei(whole: number | string): bigint {
  return parseUnits(String(whole), CHIP_DECIMALS);
}

/** Demo-mode writer: sign + send with the local demo key. */
export function demoWriter(): ChainWriter {
  return {
    faucet: () =>
      demoWalletClient.writeContract({ address: CHIP_ADDRESS, abi: CHIP_ABI, functionName: 'faucet', args: [] }),
    approve: (amount) =>
      demoWalletClient.writeContract({
        address: CHIP_ADDRESS,
        abi: CHIP_ABI,
        functionName: 'approve',
        args: [VAULT_ADDRESS, amount],
      }),
    deposit: (amount) =>
      demoWalletClient.writeContract({ address: VAULT_ADDRESS, abi: VAULT_ABI, functionName: 'deposit', args: [amount] }),
    chipBalance: (owner) =>
      publicClient.readContract({ address: CHIP_ADDRESS, abi: CHIP_ABI, functionName: 'balanceOf', args: [owner] }),
    allowance: (owner) =>
      publicClient.readContract({
        address: CHIP_ADDRESS,
        abi: CHIP_ABI,
        functionName: 'allowance',
        args: [owner, VAULT_ADDRESS],
      }),
    waitForTx: async (hash) => {
      const r = await publicClient.waitForTransactionReceipt({ hash });
      return { blockNumber: Number(r.blockNumber) };
    },
  };
}

/**
 * MetaMask-mode writer built from wagmi's writeContractAsync + a public client
 * for reads/receipts (passed in from the hook, which has wagmi context).
 */
export interface WagmiWriteDeps {
  writeContractAsync: (args: {
    address: Address;
    abi: readonly unknown[];
    functionName: string;
    args: readonly unknown[];
  }) => Promise<Hash>;
  read: (args: { address: Address; abi: readonly unknown[]; functionName: string; args: readonly unknown[] }) => Promise<unknown>;
  waitForReceipt: (hash: Hash) => Promise<{ blockNumber: number }>;
}

export function metaMaskWriter(deps: WagmiWriteDeps): ChainWriter {
  return {
    faucet: () =>
      deps.writeContractAsync({ address: CHIP_ADDRESS, abi: CHIP_ABI, functionName: 'faucet', args: [] }),
    approve: (amount) =>
      deps.writeContractAsync({ address: CHIP_ADDRESS, abi: CHIP_ABI, functionName: 'approve', args: [VAULT_ADDRESS, amount] }),
    deposit: (amount) =>
      deps.writeContractAsync({ address: VAULT_ADDRESS, abi: VAULT_ABI, functionName: 'deposit', args: [amount] }),
    chipBalance: (owner) =>
      deps.read({ address: CHIP_ADDRESS, abi: CHIP_ABI, functionName: 'balanceOf', args: [owner] }) as Promise<bigint>,
    allowance: (owner) =>
      deps.read({ address: CHIP_ADDRESS, abi: CHIP_ABI, functionName: 'allowance', args: [owner, VAULT_ADDRESS] }) as Promise<bigint>,
    waitForTx: (hash) => deps.waitForReceipt(hash),
  };
}
