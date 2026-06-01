# Hardhat dev chain + automatic contract deploy, self-contained.
# Runs a local node on 0.0.0.0:8545 and deploys ChipToken + CasinoVault on boot.
# Addresses are deterministic on a fresh Hardhat chain, so the rest of the
# stack can hard-code them (no secrets — the deployer is a well-known dev key).
FROM node:22-bookworm-slim

WORKDIR /app

# curl is used by the entrypoint to poll the RPC; bash for the script.
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install only this package's deps (standalone — not the pnpm workspace, to
# keep the image simple and independent of the monorepo install).
COPY apps/contracts-evm/package.json ./package.json
RUN npm install --no-audit --no-fund

# Contracts + scripts + config.
COPY apps/contracts-evm/contracts ./contracts
COPY apps/contracts-evm/scripts ./scripts
COPY apps/contracts-evm/hardhat.config.ts ./hardhat.config.ts
COPY apps/contracts-evm/tsconfig.json ./tsconfig.json

# Compile at build time so boot is just "node + deploy".
RUN npx hardhat compile

COPY apps/contracts-evm/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 8545
ENTRYPOINT ["./docker-entrypoint.sh"]
