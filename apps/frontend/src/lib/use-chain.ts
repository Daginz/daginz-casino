'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, useConfig } from 'wagmi';
import { readContract, waitForTransactionReceipt } from 'wagmi/actions';
import { formatUnits, type Address, type Hash } from 'viem';
import { api, type BalanceResult } from './api';
import { useSession } from '@/app/session-provider';
import { CHIP_DECIMALS } from './contracts';
import { chipToWei, demoWriter, metaMaskWriter, type ChainWriter } from './chain-actions';

type BusyOp = 'faucet' | 'deposit' | 'withdraw' | null;

export type TxStepStatus = 'pending' | 'active' | 'done' | 'error';

export interface TxStep {
  key: string;
  label: string;
  status: TxStepStatus;
  /** On-chain tx hash once submitted (for the explorer link). */
  hash?: Hash;
  /** Block number once mined. */
  block?: number;
  /** Extra note, e.g. "credited off-chain by the listener". */
  note?: string;
}

export interface TxFlow {
  kind: 'faucet' | 'deposit' | 'withdraw';
  title: string;
  steps: TxStep[];
  done: boolean;
}

/**
 * Cashier hook. Reads both balances (on-chain CHIP wallet + off-chain ledger
 * "casino" balance) and runs faucet/deposit/withdraw with the correct signer
 * for the active wallet mode. Deposits poll the ledger until the backend's
 * on-chain listener credits the event (eventual, ~seconds).
 */
export function useChain() {
  const { mode, address, status } = useSession();
  const wagmiConfig = useConfig();
  const { writeContractAsync } = useWriteContract();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<BusyOp>(null);
  const [txFlow, setTxFlow] = useState<TxFlow | null>(null);

  const ready = status === 'connected' && !!address;

  // Patch a single step in the active flow by key.
  const patchStep = useCallback((key: string, patch: Partial<TxStep>) => {
    setTxFlow((f) => {
      if (!f) return f;
      const steps = f.steps.map((st) => (st.key === key ? { ...st, ...patch } : st));
      return { ...f, steps, done: steps.every((s) => s.status === 'done' || s.status === 'error') };
    });
  }, []);

  const startFlow = useCallback((flow: TxFlow) => setTxFlow(flow), []);
  const clearFlow = useCallback(() => setTxFlow(null), []);

  const writer: ChainWriter = useMemo(() => {
    if (mode === 'demo') return demoWriter();
    return metaMaskWriter({
      writeContractAsync: (args) =>
        writeContractAsync({
          address: args.address,
          abi: args.abi as never,
          functionName: args.functionName as never,
          args: args.args as never,
        }),
      read: (args) =>
        readContract(wagmiConfig, {
          address: args.address,
          abi: args.abi as never,
          functionName: args.functionName as never,
          args: args.args as never,
        }),
      waitForReceipt: async (hash: Hash) => {
        const r = await waitForTransactionReceipt(wagmiConfig, { hash });
        return { blockNumber: Number(r.blockNumber) };
      },
    });
  }, [mode, writeContractAsync, wagmiConfig]);

  // Off-chain ledger (casino) balance — whole CHIP, from the backend.
  const casino = useQuery({
    queryKey: ['casinoBalance', address],
    enabled: ready,
    refetchInterval: 8000,
    queryFn: async () => {
      const r = await api.get<BalanceResult>('/wallet/balance');
      return Number(r.amount);
    },
  });

  // On-chain CHIP in the connected wallet.
  const wallet = useQuery({
    queryKey: ['walletBalance', address],
    enabled: ready,
    refetchInterval: 8000,
    queryFn: async () => {
      const wei = await writer.chipBalance(address as Address);
      return Number(formatUnits(wei, CHIP_DECIMALS));
    },
  });

  const refreshCasino = useCallback(() => qc.invalidateQueries({ queryKey: ['casinoBalance', address] }), [qc, address]);
  const refreshWallet = useCallback(() => qc.invalidateQueries({ queryKey: ['walletBalance', address] }), [qc, address]);

  const faucet = useCallback(async () => {
    setBusy('faucet');
    startFlow({
      kind: 'faucet',
      title: 'Minting test CHIP',
      done: false,
      steps: [{ key: 'mint', label: 'Mint 1,000 CHIP', status: 'active' }],
    });
    try {
      const hash = await writer.faucet();
      patchStep('mint', { hash, label: 'Mint submitted — awaiting block' });
      const { blockNumber } = await writer.waitForTx(hash);
      patchStep('mint', { status: 'done', block: blockNumber, label: 'Minted 1,000 CHIP' });
      await refreshWallet();
    } catch (e) {
      patchStep('mint', { status: 'error', label: 'Mint failed' });
      throw e;
    } finally {
      setBusy(null);
    }
  }, [writer, refreshWallet, startFlow, patchStep]);

  const deposit = useCallback(
    async (whole: number) => {
      setBusy('deposit');
      const amountWei = chipToWei(whole);
      const owner = address as Address;
      const needsApprove = (await writer.allowance(owner)) < amountWei;
      startFlow({
        kind: 'deposit',
        title: `Depositing ${whole} CHIP`,
        done: false,
        steps: [
          ...(needsApprove ? [{ key: 'approve', label: 'Approve vault', status: 'pending' as TxStepStatus }] : []),
          { key: 'deposit', label: 'Deposit to vault', status: 'pending' },
          { key: 'credit', label: 'Credit casino balance (off-chain listener)', status: 'pending' },
        ],
      });
      try {
        if (needsApprove) {
          patchStep('approve', { status: 'active' });
          const aHash = await writer.approve(amountWei);
          patchStep('approve', { hash: aHash });
          const { blockNumber } = await writer.waitForTx(aHash);
          patchStep('approve', { status: 'done', block: blockNumber });
        }
        patchStep('deposit', { status: 'active' });
        const depHash = await writer.deposit(amountWei);
        patchStep('deposit', { hash: depHash, label: 'Deposit submitted — awaiting block' });
        const { blockNumber } = await writer.waitForTx(depHash);
        patchStep('deposit', { status: 'done', block: blockNumber, label: 'Deposit mined' });
        await refreshWallet();

        // The backend listener credits the ledger asynchronously after it sees
        // the on-chain Deposit event — a distinct, visible step.
        patchStep('credit', { status: 'active' });
        const before = casino.data ?? 0;
        const credited = await pollUntilCredited(refreshCasino, before, () =>
          api.get<BalanceResult>('/wallet/balance').then((r) => Number(r.amount)),
        );
        patchStep('credit', {
          status: credited ? 'done' : 'error',
          note: credited ? 'Listener confirmed the deposit on-chain' : 'Not credited yet — check Activity',
        });
      } catch (e) {
        setTxFlow((f) => (f ? { ...f, steps: f.steps.map((st) => (st.status === 'active' ? { ...st, status: 'error' } : st)), done: true } : f));
        throw e;
      } finally {
        setBusy(null);
      }
    },
    [writer, address, refreshWallet, refreshCasino, casino.data, startFlow, patchStep],
  );

  const withdraw = useCallback(
    async (whole: number) => {
      setBusy('withdraw');
      startFlow({
        kind: 'withdraw',
        title: `Withdrawing ${whole} CHIP`,
        done: false,
        steps: [
          { key: 'request', label: 'Request withdrawal', status: 'active' },
          { key: 'release', label: 'Vault releases CHIP on-chain', status: 'pending' },
        ],
      });
      try {
        // Backend owns the vault: it debits the ledger and releases CHIP on-chain.
        const res = await api.post<{ txHash?: string; withdrawalId?: string }>('/onchain/withdraw', {
          amount: String(Math.trunc(whole)),
        });
        patchStep('request', { status: 'done', note: 'Ledger debited' });
        patchStep('release', {
          status: 'done',
          hash: res.txHash as Hash | undefined,
          note: res.txHash ? 'Owner sent the release tx' : undefined,
        });
        await refreshCasino();
        await refreshWallet();
      } catch (e) {
        patchStep('request', { status: 'error', label: 'Withdrawal failed' });
        throw e;
      } finally {
        setBusy(null);
      }
    },
    [refreshCasino, refreshWallet, startFlow, patchStep],
  );

  return {
    ready,
    busy,
    txFlow,
    clearFlow,
    casinoBalance: casino.data ?? 0,
    walletBalance: wallet.data ?? 0,
    faucet,
    deposit,
    withdraw,
    refreshCasino,
    refreshWallet,
  };
}

/**
 * Poll the ledger up to ~12s for the deposit to be credited by the listener.
 * Returns true once the balance rises above `before` (i.e. the listener saw
 * the on-chain event and credited), false if it never did within the window.
 */
async function pollUntilCredited(
  refresh: () => Promise<void> | void,
  before: number,
  read: () => Promise<number>,
): Promise<boolean> {
  let credited = false;
  for (let i = 0; i < 8; i += 1) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const now = await read();
      if (now > before) {
        credited = true;
        break;
      }
    } catch {
      /* keep polling */
    }
  }
  await refresh();
  return credited;
}
