'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useChain } from '@/lib/use-chain';
import { useSpin, type SpinState } from '@/lib/use-spin';
import { useTheme } from './theme-provider';

interface GameCtx {
  spin: SpinState & { spin: (stake: number) => Promise<void>; rows: number };
  chain: ReturnType<typeof useChain>;
  stake: number;
  setStake: (n: number) => void;
}

const Ctx = createContext<GameCtx | null>(null);

/**
 * Shares one spin + chain instance across the slot, the bet bar, the verify
 * panel and the history list — so "last spin" and balances stay in lockstep
 * without prop-drilling through the layout.
 */
export function GameProvider({ children }: { children: ReactNode }) {
  const { anim } = useTheme();
  const chain = useChain();
  const spin = useSpin(anim, () => {
    void chain.refreshCasino();
    void chain.refreshWallet();
  });
  const [stake, setStake] = useState(50);

  const value = useMemo<GameCtx>(() => ({ spin, chain, stake, setStake }), [spin, chain, stake]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): GameCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
