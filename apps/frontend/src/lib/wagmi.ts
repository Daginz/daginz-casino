/**
 * wagmi config: MetaMask (injected) over the chains our backend supports —
 * local Hardhat (31337) for dev and Sepolia (11155111) for testnet. The active
 * chain id is read from env so the same build points at either.
 */
import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import type { Chain } from 'viem';

export const hardhat: Chain = {
  id: 31337,
  name: 'Hardhat',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
};

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? 'http://127.0.0.1:8545';

export const wagmiConfig = createConfig({
  chains: [hardhat, sepolia],
  // Plain injected() (no target) discovers MetaMask via EIP-6963 AND legacy
  // window.ethereum. Pinning target:'metaMask' breaks when MetaMask only
  // announces itself through EIP-6963 → "Provider not found".
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [hardhat.id]: http(RPC_URL),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? undefined),
  },
  ssr: true,
});

/** Which chain the backend's listener is watching (dev: Hardhat). */
export const ACTIVE_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? hardhat.id);

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
