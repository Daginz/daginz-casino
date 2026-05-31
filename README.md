# Casino (testnet, wallet-connect)

Crypto casino on a testnet. Players connect their own wallet (MetaMask) — no real money, no custody, no KYC.
Учебный fullstack-проект: правильная архитектура, Web3, provably-fair.

> Архитектура и план: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Ресёрч-материалы — в `docs/`.

## Стек

| Часть | Технология |
|---|---|
| Backend | NestJS (модульный монолит, TypeScript strict) |
| Wallet / Ledger | Go (отдельный сервис) |
| Frontend | Next.js (App Router) + wagmi/viem |
| Smart contracts | Solidity (Hardhat/Foundry), тестнет |
| Данные | PostgreSQL + Redis (Docker Compose) |
| Шина | BullMQ/Redis → Kafka/NATS (позже) |

## Структура

```
apps/
  backend/        NestJS модульный монолит
  wallet/         Go сервис (ledger)
  frontend/       Next.js
  contracts-evm/  Solidity (позже, Block F)
packages/
  contracts/      OpenAPI / общие типы
  config/         общие пресеты
infra/
  docker-compose.yml
docs/             архитектура + ресёрч
```

## Быстрый старт

```bash
# 1. поднять инфраструктуру (Postgres + Redis)
pnpm infra:up

# 2. установить зависимости (JS)
pnpm install

# 3. скопировать env
cp .env.example .env

# 4. запустить всё в dev-режиме
pnpm dev
```

> Запуск собранного backend: `node --env-file=.env dist/main.js` (Node 22 читает .env нативно).
> Если порт 4000 занят «зомби»-процессом: `netstat -ano | grep :4000` → `taskkill /PID <pid> /F`.

Сервисы:
- Backend: http://localhost:4000  (health: `/health`)
- Wallet (Go): http://localhost:4100  (health: `/health`)
- Frontend: http://localhost:3000

## Прогресс (блоки)

- [x] **A** — Архитектурный дизайн
- [x] **B** — Фундамент монорепо + инфра
- [x] **C** — Скелеты всех сервисов (контракты + заглушки)
- [ ] **D** — Ядро: Auth → Wallet/Ledger → Provably-Fair  ← сейчас
- [ ] **E** — Первая вертикаль Dice end-to-end
- [ ] **F** — On-chain слой
- [ ] **G** — Обвязка, тесты, observability
