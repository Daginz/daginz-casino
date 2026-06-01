# Next.js frontend (standalone) in a pnpm monorepo.
# NEXT_PUBLIC_* are baked at BUILD time and are read by the BROWSER, so they
# must point at host-published ports (localhost:*), not docker-internal names.
FROM node:22-bookworm-slim AS build
WORKDIR /repo
RUN npm install -g pnpm@10.29.3

# Browser-facing config (build args → env for `next build`).
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_CHAIN_ID=31337
ARG NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
ARG NEXT_PUBLIC_CHIP_TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ARG NEXT_PUBLIC_VAULT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_CHAIN_ID=$NEXT_PUBLIC_CHAIN_ID \
    NEXT_PUBLIC_RPC_URL=$NEXT_PUBLIC_RPC_URL \
    NEXT_PUBLIC_CHIP_TOKEN_ADDRESS=$NEXT_PUBLIC_CHIP_TOKEN_ADDRESS \
    NEXT_PUBLIC_VAULT_ADDRESS=$NEXT_PUBLIC_VAULT_ADDRESS \
    NEXT_OUTPUT_TRACING_ROOT=/repo \
    NEXT_TELEMETRY_DISABLED=1

# Workspace manifests (all, for a frozen-lockfile install).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/frontend/package.json apps/frontend/
COPY apps/backend/package.json apps/backend/
COPY apps/contracts-evm/package.json apps/contracts-evm/
RUN pnpm install --frozen-lockfile

COPY packages/contracts ./packages/contracts
COPY apps/frontend ./apps/frontend
RUN pnpm --filter @casino/frontend build

# ---- runtime: minimal standalone server ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

# standalone bundles the server + traced node_modules; static assets sit beside it.
COPY --from=build /repo/apps/frontend/.next/standalone ./
COPY --from=build /repo/apps/frontend/.next/static ./apps/frontend/.next/static

EXPOSE 3000
# standalone server entry for this app within the monorepo layout.
CMD ["node", "apps/frontend/server.js"]
