import type { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

/**
 * Local-first config. `hardhat node` runs an in-process chain on :8545.
 * Sepolia is added later via SEPOLIA_RPC_URL + DEPLOYER_KEY env vars.
 */
const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.28',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    localhost: { url: 'http://127.0.0.1:8545' },
    ...(process.env.SEPOLIA_RPC_URL
      ? {
          sepolia: {
            url: process.env.SEPOLIA_RPC_URL,
            accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
          },
        }
      : {}),
  },
};

export default config;
