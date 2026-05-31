# Архитектура крипто-казино (тестнет, wallet-connect)

> Проект: учебный fullstack крипто-казино на тестнете. Игрок подключает свой кошелёк (MetaMask).
> Реальных денег нет → нет лицензии/KYC/custody. Фокус: правильная архитектура, Web3, provably-fair.
> Подход: **модульный монолит (NestJS) + Wallet-сервис на Go**, готовый к распилу на микросервисы.

---

## 0. Ключевые архитектурные решения (зафиксировано)

| Решение | Выбор | Почему |
|---|---|---|
| Гранулярность | Модульный монолит → распил | Чёткие границы (contracts/), но один деплой. Любой модуль выносится без переписывания |
| Язык ядра денег | **Go** (Wallet/Ledger) | Горячий путь, латентность, конкурентность — как в реальных казино |
| Язык остального | **TypeScript / NestJS** | Стек пользователя, единый язык, быстрая разработка |
| Логика игр | **Гибрид** | RNG/логика off-chain (быстро, дёшево), расчёты/депозит on-chain + provably-fair |
| Шаринг типов | **OpenAPI-генерация** | Backend — источник правды, фронт генерит типизированный клиент |
| Локальная инфра | **Docker Compose** | Postgres + Redis + шина одной командой |
| Frontend | **Next.js + wagmi/viem** | App Router, Web3-стек |
| Auth | **SIWE (EIP-4361)** | Кошелёк = идентичность, без паролей |

---

## 1. Карта сервисов и стек

### Backend — NestJS модульный монолит (TypeScript)
| Модуль/сервис | Ответственность | Стек |
|---|---|---|
| **API Gateway** | вход, auth-guard, rate-limit, роутинг, агрегация | NestJS + Nginx (prod) |
| **Auth / Player (PAM)** | SIWE, JWT, профиль, сессии, привязка адреса | NestJS + Postgres |
| **Provably-Fair** | server/client seed, commit-reveal, верификация | NestJS (чистая логика) |
| **Game Engine** | приём ставки, оркестрация исхода, выплата | NestJS |
| **Game Catalog** | список игр, категории, метаданные | NestJS + Postgres |
| **Bonus Engine** | бонусы, фриспины, wagering (тестнет) | NestJS + Postgres |
| **CRM / Retention** | сегменты, события активности (заглушка→) | NestJS |
| **Risk** | паттерны, лимиты, anti-abuse | NestJS |
| **Reporting / BI** | метрики, агрегаты | NestJS + ClickHouse (позже) |
| **On-chain Listener** | слушает события контракта, реконсиляция | NestJS + viem |

### Wallet / Ledger — отдельный сервис (Go)
| Компонент | Ответственность |
|---|---|
| **Ledger** | double-entry проводки, неизменяемый журнал |
| **Balance** | баланс = сумма проводок (тестнет-кредиты) |
| **Wallet API** | bet / win / rollback / deposit / withdraw, идемпотентность |
| **Locking** | pessimistic (SELECT FOR UPDATE) против race condition |

Протокол Backend ↔ Wallet: **gRPC** (быстро, типизировано) или REST на старте.

### Frontend — Next.js (TypeScript)
- App Router, RSC по умолчанию, `'use client'` только для Web3/интерактива.
- **wagmi + viem** — подключение кошелька, подпись, чтение чейна.
- SIWE-флоу, лобби, игровые экраны, баланс/история, **provably-fair verifier UI**.
- Типизированный API-клиент генерится из OpenAPI бэкенда.

### Smart contracts — Solidity (тестнет)
- Контракт депозита/вывода (escrow тестнет-токенов).
- **Hardhat** или **Foundry** + viem для интеграции.
- Сеть: Sepolia / локальный Anvil.

---

## 2. Структура монорепо (pnpm workspace)

```
casino/
├── apps/
│   ├── backend/                 # NestJS модульный монолит
│   │   ├── src/
│   │   │   ├── contracts/       # Symbol-токены + интерфейсы (границы)
│   │   │   ├── modules/         # auth, game, provably-fair, bonus, ...
│   │   │   ├── shared/          # errors, result, guards, filters, cls
│   │   │   ├── config/          # env.ts + env.schema.ts (Zod, fail-fast)
│   │   │   └── composition/     # app.module.ts
│   │   └── test/
│   ├── wallet/                  # Go сервис (ledger)
│   │   ├── cmd/                 # main
│   │   ├── internal/
│   │   │   ├── ledger/          # double-entry
│   │   │   ├── balance/
│   │   │   ├── api/             # gRPC/REST handlers
│   │   │   └── store/           # Postgres (sqlc/pgx)
│   │   └── proto/               # gRPC контракты
│   ├── frontend/                # Next.js
│   │   ├── app/
│   │   ├── lib/                 # wagmi config, api-client (gen)
│   │   └── components/
│   └── contracts-evm/           # Solidity (Hardhat/Foundry)
│       ├── contracts/
│       └── test/
├── packages/
│   ├── contracts/               # OpenAPI spec + сгенерённые TS-типы/Zod
│   ├── config/                  # общий eslint, tsconfig, prettier
│   └── shared-types/            # branded types (UserId, GameRoundId...)
├── infra/
│   ├── docker-compose.yml       # Postgres, Redis, (Kafka/NATS опц.)
│   └── migrations/
├── pnpm-workspace.yaml
├── Makefile                     # make up / make dev / make test
└── ARCHITECTURE.md
```

---

## 3. Карта данных (Postgres-схемы по доменам)

> Принцип: каждый модуль владеет своими таблицами, чужие — только через контракт.

- **auth/player:** `players (id, wallet_address, created_at, status)`, `sessions`, `nonces`
- **wallet/ledger (Go):** `accounts`, `ledger_entries (immutable, double-entry)`, `idempotency_keys`
- **provably-fair:** `seed_pairs (server_seed_hash, server_seed, client_seed, nonce, revealed_at)`
- **game:** `game_rounds (id, player_id, game_type, bet, outcome, payout, seed_pair_id, status)`
- **catalog:** `games (id, slug, type, meta)`
- **bonus:** `bonuses`, `player_bonuses (wagering_progress)`
- **onchain:** `deposits`, `withdrawals`, `chain_events (reconciliation)`

---

## 4. Карта событий (шина — BullMQ/Redis на старте, Kafka/NATS позже)

```
auth.player.registered      → CRM, Reporting
wallet.bet.placed           → Bonus(wagering), Risk, Reporting
wallet.win.credited         → Reporting
game.round.completed        → CRM, Reporting, Bonus
onchain.deposit.confirmed   → Wallet(credit), Reporting
onchain.withdraw.requested  → Wallet(debit+lock), OnchainListener
```

Паттерны: **Outbox** (гарантия доставки), **Saga** (депозит = on-chain + ledger).

---

## 5. Сквозной поток: один спин Dice (гибрид)

```
1. Frontend: игрок подключил кошелёк (SIWE) → JWT
2. Frontend → Gateway → Game Engine: POST /games/dice/bet {amount, target, clientSeed}
3. Game Engine → Wallet(Go): debit bet (idempotency-key) → проводка
4. Game Engine → Provably-Fair: outcome = f(serverSeed, clientSeed, nonce)
5. Game Engine: расчёт payout
6. Game Engine → Wallet(Go): credit win (если есть)
7. Game Engine → шина: game.round.completed
8. Подписчики: Bonus (wagering), Risk, Reporting
9. Frontend: показ результата + reveal данные для verifier
```

Депозит/вывод (отдельно, on-chain):
```
deposit:  игрок шлёт тестнет-токены на контракт → Listener ловит событие
          → Wallet credit (ledger) → баланс в UI
withdraw: запрос → Wallet debit+lock → контракт выплачивает on-chain
          → Listener подтверждает → реконсиляция
```

---

## 6. Порядок строительства (блоки = задачи в трекере)

| Блок | Что | Зависит от |
|---|---|---|
| **A** | Архитектурный дизайн (этот документ + диаграмма) | — |
| **B** | Фундамент монорепо + docker-compose + скелеты всех apps | A |
| **C** | Скелеты ВСЕХ сервисов: контракты + health/stub | B |
| **D** | Наполнение ядра: Auth → Wallet/Ledger → Provably-Fair | C |
| **E** | Первая вертикаль Dice end-to-end + frontend | D |
| **F** | On-chain слой (контракт депозит/вывод + listener) | E |
| **G** | Обвязка: шина-подписчики, тесты, observability, RG-UI | F |

**Принцип:** строим изнутри наружу. Сначала вся карта (A), потом каркас всех сервисов (B–C), потом ядро денег/честности (D), потом первая игра сквозь всю систему (E), потом блокчейн (F), потом качество и обвязка (G).

---

## 7. Что осознанно отложено / упрощено (тестнет)

- ❌ Лицензия, KYC, fiat-PSP, custody — не нужны (тестнет, свой кошелёк).
- ⏳ Kafka → на старте BullMQ/Redis, мигрируем если нужно.
- ⏳ ClickHouse → Reporting сначала на Postgres.
- ⏳ Kubernetes → docker-compose локально; k8s — если будем деплоить.
- ✅ RG-инструменты в UI делаем (демо знания регуляций для портфолио), но без гос-реестров.
```
