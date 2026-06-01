# Daginz — provably-fair crypto casino (testnet)

A full-stack crypto casino on a testnet. Players connect their own wallet
(MetaMask) or a built-in demo wallet — **no real money, no custody, no KYC**.
Every spin is **provably fair** (commit-reveal) and verifiable in the browser;
every on-chain transaction is traceable to a public block explorer.

> Built as a serious portfolio project: clean contracts-first architecture,
> Web3 wallet auth (SIWE), a double-entry ledger, on-chain escrow, and a
> pixel-faithful animated frontend.

**Architecture deep-dive:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ·
**Full project doc:** [`docs/PROJECT.md`](docs/PROJECT.md) ·
**Diagram:** [`docs/architecture.drawio`](docs/architecture.drawio)

---

## What it does

1. **Connect** — Sign-In With Ethereum (SIWE / EIP-4361). Your wallet address
   *is* your account; no registration, no password.
2. **Lobby** — A casino storefront: hero promos, searchable game catalogue,
   categories (Slots / Instant / Table / Live). One game is live (the slot),
   the rest are placeholders.
3. **Cashier** — Mint test CHIP from a faucet, deposit it on-chain into an
   escrow vault, and withdraw back to your wallet. Each transaction shows a
   live step-by-step status (submitted → mined block → confirmed) with a link
   to a third-party explorer.
4. **Play** — A 3×3, 5-payline slot. Outcomes are drawn by a provably-fair
   commit-reveal scheme; RTP is calibrated and published (~96%).
5. **Verify** — Reveal the server seed and recompute the outcome **in your own
   browser** — byte-for-byte identical to the backend. No trust required.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router, React 19), TypeScript strict, **Vanilla Extract**, TanStack Query, React Hook Form, Zod v4, wagmi / viem, framer-motion |
| Backend | NestJS 11 (modular monolith), contracts-first, Symbol DI, Result-pattern, pino + traceId, BullMQ event bus |
| Ledger | Go (hexagonal DDD, pgx) — double-entry ledger with idempotency |
| Smart contracts | Solidity (Hardhat) — ERC-20 `ChipToken` + `CasinoVault` escrow |
| Auth | SIWE (EIP-4361) → JWT |
| Fairness | Commit-reveal (HMAC-SHA256 over serverSeed/clientSeed/nonce) |
| Data | PostgreSQL + Redis (Docker Compose) |
| Chain | Local Hardhat (dev) → Sepolia (testnet) |

## Monorepo structure

```
apps/
  backend/        NestJS modular monolith (auth, game, wallet, onchain, provably-fair)
  wallet/         Go ledger service (double-entry, idempotent)
  frontend/       Next.js app (lobby + slot + cashier + verify)
  contracts-evm/  Solidity (ChipToken, CasinoVault) + Hardhat
packages/
  contracts/      shared TypeScript types / branded IDs
infra/
  docker-compose.yml   Postgres + Redis
docs/             architecture, diagram, regulatory research
```

## Quick start (local)

Prereqs: Node 22+, pnpm 10+, Go 1.22+, Docker.

```bash
# 1. Infrastructure (Postgres + Redis)
pnpm infra:up

# 2. JS dependencies
pnpm install

# 3. Smart contracts — start a local Hardhat node and deploy
cd apps/contracts-evm
npx hardhat node            # terminal 1 — local chain on :8545
npx hardhat run scripts/deploy.ts --network localhost   # terminal 2

# 4. Go ledger service (:4100)
cd apps/wallet && go run ./cmd/server

# 5. Backend (:4000) — reads .env for chain + DB config
cd apps/backend && cp .env.example .env   # then fill in deployed addresses
node --env-file=.env dist/main.js          # or: pnpm --filter @casino/backend dev

# 6. Frontend (:3000)
cd apps/frontend && cp .env.local.example .env.local
pnpm --filter @casino/frontend dev
```

Services:
- Frontend — http://localhost:3000
- Backend — http://localhost:4000 (`/health`, Swagger at `/docs`)
- Go ledger — http://localhost:4100 (`/health`)
- Hardhat node — http://127.0.0.1:8545 (chainId 31337)

**MetaMask on local Hardhat:** add a network with RPC `http://127.0.0.1:8545`,
chain ID `31337`. The demo wallet works without any setup. Note: any chain —
even local — charges gas, so a wallet needs test ETH to send transactions
(the demo account is pre-funded).

## How the money flow works

```
Faucet:   ChipToken.faucet()  →  +1000 CHIP in your wallet (on-chain)
Deposit:  approve(vault) → vault.deposit()  →  Deposit event
          →  backend listener credits the off-chain ledger  →  "casino balance"
Play:     POST /game/play  →  ledger debits stake, credits payout
Withdraw: POST /onchain/withdraw  →  backend (vault owner) releases CHIP on-chain
```

On-chain CHIP has 18 decimals; the ledger stores whole CHIP (integer minor
units) — conversion happens at the on-chain boundary.

## Provably fair

```
roundSeed = HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}`)
outcome   = parseInt(roundSeed.slice(0, 13), 16) / 2**52      // in [0, 1)
```

The server publishes `SHA-256(serverSeed)` *before* you play. After a reveal,
the frontend recomputes the outcome with the Web Crypto API and confirms it
matches — the same math the backend used, with no server trust.

## Status

Backend (auth, ledger, game engine, on-chain hybrid, observability) and the
full frontend (lobby, slot, cashier, provably-fair verifier, transaction
transparency) are complete and verified end-to-end against the running stack.

Not yet done: PWA, public Sepolia deployment, a second game, full mobile
lobby navigation.

## Disclaimer

Testnet only. Chips are valueless test tokens. This is **not** a real-money
gambling service and is not operable as one — see the regulatory research in
`docs/` for why offshore/crypto gambling is a legal minefield.
