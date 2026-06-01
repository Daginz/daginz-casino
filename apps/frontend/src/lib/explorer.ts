/**
 * Block-explorer links for independent verification of a transaction.
 *
 * On a public testnet (Sepolia) we link to Etherscan so the user can confirm
 * their tx on a third-party service. On the local Hardhat chain there is no
 * public explorer, so we expose the raw hash for copying instead — and say so
 * plainly rather than producing a dead link.
 */
import { ACTIVE_CHAIN_ID } from './wagmi';

interface ExplorerInfo {
  /** Human label for the explorer (or the reason there isn't one). */
  name: string;
  /** Full tx URL, or null when no public explorer exists for this chain. */
  txUrl: (hash: string) => string | null;
  /** Full address URL, or null. */
  addressUrl: (addr: string) => string | null;
}

const EXPLORERS: Record<number, ExplorerInfo> = {
  // Sepolia public testnet.
  11155111: {
    name: 'Etherscan (Sepolia)',
    txUrl: (h) => `https://sepolia.etherscan.io/tx/${h}`,
    addressUrl: (a) => `https://sepolia.etherscan.io/address/${a}`,
  },
  // Local Hardhat — no public explorer.
  31337: {
    name: 'Local Hardhat (no public explorer)',
    txUrl: () => null,
    addressUrl: () => null,
  },
};

const FALLBACK: ExplorerInfo = {
  name: 'Unknown network',
  txUrl: () => null,
  addressUrl: () => null,
};

export function explorer(): ExplorerInfo {
  return EXPLORERS[ACTIVE_CHAIN_ID] ?? FALLBACK;
}

/** True when the active chain has a public explorer to link out to. */
export function hasPublicExplorer(): boolean {
  return explorer().txUrl('0x0') !== null;
}
