'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage, useChainId, useSwitchChain } from 'wagmi';
import type { Address } from 'viem';
import { signIn, signInDemo, signOut, demoAccount } from '@/lib/auth';
import { getToken, type Player } from '@/lib/api';
import { ACTIVE_CHAIN_ID, hardhat } from '@/lib/wagmi';

export type WalletMode = 'metamask' | 'demo' | null;
export type SessionStatus = 'disconnected' | 'connecting' | 'authenticating' | 'connected';

interface SessionCtx {
  status: SessionStatus;
  mode: WalletMode;
  player: Player | null;
  address: Address | null;
  chainId: number | null;
  chainOk: boolean;
  error: string | null;
  connectMetaMask: () => Promise<void>;
  connectDemo: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => void;
}

const Ctx = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const walletChainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [status, setStatus] = useState<SessionStatus>('disconnected');
  const [mode, setMode] = useState<WalletMode>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoAddress, setDemoAddress] = useState<Address | null>(null);

  // A pre-existing JWT (page reload) keeps us "connected" optimistically until
  // a request 401s; we don't restore which wallet mode, just that a session is.
  useEffect(() => {
    if (getToken()) setStatus((s) => (s === 'disconnected' ? 'connected' : s));
  }, []);

  const connectMetaMask = useCallback(async () => {
    setError(null);
    setStatus('connecting');
    try {
      let acct: Address | undefined = isConnected ? address : undefined;
      if (!acct) {
        // No wallet at all → guide the user instead of a cryptic SDK error.
        if (typeof window !== 'undefined' && !(window as { ethereum?: unknown }).ethereum) {
          throw new Error('No browser wallet detected. Install MetaMask, or use the Demo wallet.');
        }
        // Prefer an EIP-6963-discovered MetaMask connector; fall back to the
        // generic injected one; then any connector.
        const metaMask = connectors.find((c) => c.name.toLowerCase().includes('metamask'));
        const injected = connectors.find((c) => c.id === 'injected' || c.type === 'injected');
        const connector = metaMask ?? injected ?? connectors[0];
        if (!connector) throw new Error('No wallet connector available');
        const res = await connectAsync({ connector });
        acct = res.accounts[0];
      }
      if (!acct) throw new Error('No account returned by wallet');

      setStatus('authenticating');
      const result = await signIn({
        address: acct,
        chainId: walletChainId || ACTIVE_CHAIN_ID,
        signMessage: (message) => signMessageAsync({ message }),
      });
      setPlayer(result.player);
      setMode('metamask');
      setStatus('connected');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect');
      setStatus('disconnected');
    }
  }, [address, isConnected, connectAsync, connectors, signMessageAsync, walletChainId]);

  const connectDemo = useCallback(async () => {
    setError(null);
    setStatus('authenticating');
    try {
      const result = await signInDemo();
      setPlayer(result.player);
      setDemoAddress(demoAccount.address);
      setMode('demo');
      setStatus('connected');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Demo sign-in failed');
      setStatus('disconnected');
    }
  }, []);

  const disconnect = useCallback(() => {
    signOut();
    setPlayer(null);
    setMode(null);
    setDemoAddress(null);
    setStatus('disconnected');
    void disconnectAsync().catch(() => undefined);
  }, [disconnectAsync]);

  const switchNetwork = useCallback(() => {
    if (mode === 'metamask') switchChain({ chainId: hardhat.id });
  }, [mode, switchChain]);

  const effectiveAddress: Address | null = mode === 'demo' ? demoAddress : (address ?? null);
  const effectiveChainId = mode === 'demo' ? ACTIVE_CHAIN_ID : walletChainId || null;
  const chainOk = mode === 'demo' || effectiveChainId === ACTIVE_CHAIN_ID;

  const value = useMemo<SessionCtx>(
    () => ({
      status,
      mode,
      player,
      address: effectiveAddress,
      chainId: effectiveChainId,
      chainOk,
      error,
      connectMetaMask,
      connectDemo,
      disconnect,
      switchNetwork,
    }),
    [status, mode, player, effectiveAddress, effectiveChainId, chainOk, error, connectMetaMask, connectDemo, disconnect, switchNetwork],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
