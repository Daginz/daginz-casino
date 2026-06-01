# NestJS backend in a pnpm monorepo. Needs the workspace context to resolve
# the @casino/contracts package, and the infra/migrations dir at runtime
# (the backend applies its own migrations from disk on boot).
FROM node:22-bookworm-slim AS build
WORKDIR /repo

RUN npm install -g pnpm@10.29.3

# Workspace manifests first (better layer caching). All workspace package.json
# files must be present for a --frozen-lockfile install to resolve the graph.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY apps/contracts-evm/package.json apps/contracts-evm/
# Full install (all workspaces incl. devDeps) so tsc is available to build the
# shared types package and the backend. Build-stage only; runtime stays --prod.
RUN pnpm install --frozen-lockfile

# Shared root tsconfig (the packages extend ../../tsconfig.base.json).
COPY tsconfig.base.json ./
# Sources for the backend + its workspace dep.
COPY packages/contracts ./packages/contracts
COPY apps/backend ./apps/backend

# Build the shared types package, then the backend.
RUN pnpm --filter @casino/contracts build \
  && pnpm --filter @casino/backend build

# ---- runtime ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /repo
RUN npm install -g pnpm@10.29.3

ENV NODE_ENV=production

# Manifests + production deps only.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY apps/contracts-evm/package.json apps/contracts-evm/
RUN pnpm install --frozen-lockfile --prod --filter @casino/backend... --filter @casino/contracts

# Built artifacts.
COPY --from=build /repo/packages/contracts/dist ./packages/contracts/dist
COPY --from=build /repo/apps/backend/dist ./apps/backend/dist

# Migrations are read from ../../infra/migrations relative to the backend cwd.
COPY infra/migrations ./infra/migrations

WORKDIR /repo/apps/backend
EXPOSE 4000
# main.js resolves migrationsDir as join(cwd, '..','..','infra','migrations').
CMD ["node", "dist/main.js"]
