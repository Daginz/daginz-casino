# Crypto Casino (testnet) — Полная документация проекта

> Единый документ: что это, как устроено, что уже работает, что в процессе, как запускать, и план дальше.
> Учебный fullstack крипто-казино на тестнете. Игрок подключает свой кошелёк (MetaMask).
> Реальных денег нет → нет лицензии, KYC, custody. Фокус: правильная архитектура, Web3, provably-fair.
>
> Связанные документы: [`ARCHITECTURE.md`](ARCHITECTURE.md) (исходный архитектурный дизайн),
> ресёрч-материалы по индустрии: `casino-ux-research.md`, `casino-eu-regulations.md`,
> `casino-regulations-metrics.md`, `casino-offshore-grey-market.md`.

Дата сборки документа: 2026-05-31.

---

## 1. Что это и зачем

Крипто-казино на тестнете как **реальный продукт** (не прототип), собираемый fullstack.
Цель — не одна игра, а **платформа**: движок, на который игры навешиваются как плагины.

**Принципы:**
- Строим **изнутри наружу**: сначала деньги и аккаунт (ядро), потом игра, потом обвязка, в конце — внешние интеграции.
- Каждый блок **проверяется вживую** (smoke-тесты, реальные транзакции), а не «вроде собралось».
- Игр будет много → обобщённый Game Engine, добавление игры = один файл-определение.

---

## 2. Технологический стек (зафиксировано)

| Часть | Технология | Почему |
|---|---|---|
| Backend | **NestJS 11** (модульный монолит, TS strict) | стек пользователя, контракты-first, DI |
| Wallet / Ledger | **Go 1.26** (отдельный сервис) | деньги на горячем пути — быстрый язык, hexagonal DDD |
| Frontend | **Next.js 15 + React 19 + wagmi/viem** | App Router, Web3-стек (пока скелет) |
| Smart contracts | **Solidity 0.8.28 + Hardhat + OpenZeppelin** | EVM, MetaMask, viem — единая экосистема |
| Цепь | **Ethereum** (локальный Hardhat node → Sepolia) | MetaMask, SIWE, востребованность |
| Токен | **свой ERC-20 `CHIP`** + открытый faucet | сам раздаёшь фишки, реалистично |
| Данные | **PostgreSQL 17 + Redis 7** (Docker Compose) | ACID для ledger, Redis для кэша/сессий |
| Auth | **SIWE (EIP-4361) + JWT** | кошелёк = идентичность, без паролей |

**Окружение разработки:** Windows 11, Node 22, pnpm 10, Go 1.26, Docker 29.
Известные грабли Windows (и обходы) — см. раздел 9.

---

## 3. Архитектура (карта сервисов)

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT — Next.js + wagmi/viem (скелет)                        │
│  лобби · игровой экран · provably-fair verifier · wallet conn │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST + JWT (SIWE)
┌───────────────────────────▼─────────────────────────────────┐
│ BACKEND — NestJS модульный монолит (TS), границы в contracts/ │
│  ┌──────────┬───────────┬──────────────┬──────────────────┐  │
│  │ Auth     │ Game       │ Provably-Fair │ Onchain Listener │  │
│  │ (SIWE)   │ Engine     │ (commit-      │ (viem, polling)  │  │
│  │ + JWT    │ + Registry │  reveal)      │                  │  │
│  └────┬─────┴─────┬──────┴──────┬───────┴────────┬─────────┘  │
└───────┼───────────┼─────────────┼────────────────┼───────────┘
        │ gRPC/HTTP │ ledger ops  │                │ events / tx
        ▼           ▼             ▼                ▼
┌──────────────────────────┐         ┌────────────────────────────┐
│ WALLET/LEDGER — Go        │         │ ON-CHAIN — Ethereum testnet │
│ double-entry, idempotent  │◄────────│ ChipToken (ERC-20)          │
│ Postgres, hexagonal DDD   │ credit  │ CasinoVault (escrow)        │
└──────────────────────────┘         └────────────────────────────┘
        │                                      ▲
        ▼                                      │ Deposit event / withdraw tx
┌──────────────────────────┐                  │
│ PostgreSQL + Redis        │──────────────────┘
└──────────────────────────┘
```

**Ключевое разделение:** деньги (Go-ledger) изолированы от бизнес-логики (NestJS).
Игры не знают про деньги/RNG напрямую — только через порты (контракты).

---

## 4. Структура репозитория

```
casino/
├── apps/
│   ├── backend/              NestJS модульный монолит
│   │   ├── src/
│   │   │   ├── contracts/             # Symbol-токены + интерфейсы (границы)
│   │   │   │   ├── auth.contract.ts
│   │   │   │   ├── wallet.contract.ts
│   │   │   │   ├── provably-fair.contract.ts
│   │   │   │   └── data-providers/    # репозиторий-порты (player, seed, round, onchain)
│   │   │   ├── modules/
│   │   │   │   ├── auth/              # SIWE + JWT + players (Postgres)
│   │   │   │   ├── wallet/            # HTTP-адаптер к Go-ledger
│   │   │   │   ├── provably-fair/     # commit-reveal lifecycle
│   │   │   │   ├── game/              # движок + реестр + слот + история
│   │   │   │   │   ├── engine/        # game-definition, registry, engine, rng
│   │   │   │   │   └── games/slot/    # референс-игра (3x3)
│   │   │   │   └── onchain/           # listener (viem) + Postgres-курсор
│   │   │   ├── shared/                # Result<T,E>, DomainError, filter, db
│   │   │   ├── config/                # env (Zod, fail-fast)
│   │   │   └── composition/app.module.ts
│   │   └── scripts/                   # smoke + RTP-симуляции (.mjs)
│   ├── wallet/               Go сервис (hexagonal DDD)
│   │   ├── cmd/server/               # composition root
│   │   └── internal/ledger/
│   │       ├── domain/               # Amount, Entry, ports (чистый домен)
│   │       ├── app/                  # Service (bet/win/idempotency)
│   │       └── adapters/             # memory, postgres (pgx), httpapi
│   ├── frontend/             Next.js (скелет)
│   └── contracts-evm/        Solidity (Hardhat)
│       ├── contracts/        ChipToken.sol, CasinoVault.sol
│       ├── test/             casino.test.ts (5 тестов)
│       └── scripts/          deploy.ts, onchain-smoke.ts, deposit-as-player.ts
├── packages/contracts/       branded-типы (PlayerId, GameRoundId, WalletAddress)
├── infra/
│   ├── docker-compose.yml    Postgres 17 + Redis 7
│   └── migrations/           0001..0005 (.sql)
└── docs/                     этот файл + ARCHITECTURE.md + ресёрч
```

---

## 5. Прогресс по блокам

| Блок | Что | Статус |
|---|---|---|
| **A** | Архитектурный дизайн (всё определено до кода) | ✅ завершён |
| **B** | Фундамент монорепо + инфра (Docker, скелеты apps) | ✅ завершён |
| **C** | Скелеты всех сервисов (контракты + заглушки) | ✅ завершён |
| **D** | Ядро: Wallet/Ledger + SIWE auth + Provably-Fair | ✅ завершён |
| **E** | Game Engine framework + слот (RTP калиброван) | ✅ завершён |
| **F** | On-chain слой (контракты + listener) | 🔵 **в процессе** (F-1, F-2 ✅; F-3 в отладке) |
| **G** | Обвязка, тесты, observability | ⬜ не начат |

**Подзадачи на потом:** 243-ways слот как 2-я игра (доказать расширяемость фреймворка).

---

## 6. Что реально работает (проверено вживую)

### Ядро (Блок D) — ✅
- **Wallet/Ledger (Go):** double-entry на Postgres, идемпотентность по уникальному ключу,
  `bet`/`win`/баланс, 409 при овердрафте. Проверено: win 100 → bet 30 → баланс 70, повтор не задваивает.
- **Auth/SIWE:** реальная подпись кошельком (viem) → `siwe`-верификация → JWT → `/auth/me`.
  Nonce одноразовый (replay → 401). Игрок upsert-ится в Postgres по адресу.
- **Provably-Fair:** commit-reveal lifecycle. `getActiveCommitment` (только hash) →
  `draw` (атомарный инкремент nonce) → `reveal` → публичный `verify`. Подделка отклоняется.
  Формула: `outcome = HMAC_SHA256(serverSeed, "{clientSeed}:{nonce}")` → float [0,1).

### Game Engine (Блок E) — ✅
- **Обобщённый движок:** `GameDefinition<P,D>` — игра реализует только `validateParams` +
  `evaluate(rng, params, stake) → {payout, detail}`. Всё остальное (ставка → ledger →
  provably-fair → история) делает движок. Игры регистрируются в `GameRegistry`.
- **Round lifecycle:** validate → `wallet.bet` → `pf.draw` → `definition.evaluate` →
  `wallet.win` → persist → return. Идемпотентные ключи `bet:/win:` на раунд.
- **Референс-игра — слот 3x3:** 6 символов, WILD, 5 линий выплат.
  **RTP откалиброван** через точный перебор (216 комбинаций линии), сверено с симуляцией:
  теория ≈ симуляция ≈ БД (≈94.6% на 1M спинов).
- **Деньги реально ходят:** депозит-фейк (faucet в ledger) → 500 раундов → баланс
  сходится точно через всю цепочку движок → Go-ledger → Postgres.
- **Эндпоинты:** `GET /game/list`, `POST /game/play` (JWT), `GET /game/rounds/:id`, `GET /game/history`.

### On-chain (Блок F) — частично ✅
- **F-1 контракты ✅:** `ChipToken` (ERC-20, faucet 1000 CHIP/вызов) + `CasinoVault`
  (escrow: `deposit` → событие, `withdraw` owner→игрок). ReentrancyGuard, SafeERC20.
  **5/5 Hardhat-тестов проходят.**
- **F-2 on-chain smoke ✅:** деплой на живую ноду, faucet → approve → deposit
  (событие, nonce) → owner withdraw. Балансы сходятся. **PASS.**
- **F-3 listener 🔵 в отладке:** сервис написан, **компилируется (typecheck=0)**,
  **запускается** (лог «On-chain listener started»). Но в последнем прогоне депозит
  on-chain **не закредитовался** в ledger за 20с — **причина ещё не найдена** (см. раздел 8).

---

## 7. Модель данных (Postgres-миграции)

| Миграция | Владелец | Таблицы |
|---|---|---|
| `0001_ledger.sql` | Go-wallet (embed) | `ledger_entries` (append-only, idempotency_key UNIQUE) |
| `0002_players.sql` | backend | `players` (wallet_address UNIQUE) |
| `0003_provably_fair_seeds.sql` | backend | `pf_seeds` (1 active/игрок, partial unique idx) |
| `0004_game_rounds.sql` | backend | `game_rounds` (+ JSONB `detail` для любой игры) |
| `0005_onchain.sql` | backend | `onchain_cursor` (singleton), `onchain_deposits` (dedupe), `onchain_withdrawals` |

> Раннер миграций бэкенда применяет только свои файлы (allowlist), чтобы не конфликтовать
> с Go-wallet, который владеет ledger-миграцией через `go:embed`.

---

## 8. On-chain listener (Блок F-3) — как задумано и где затык

**Задумка (поллинг + курсор, в backend на viem):**
1. Каждые `ONCHAIN_POLL_MS` читать новые блоки через `getLogs` по событию `Deposit`.
2. Курсор последнего обработанного блока — в `onchain_cursor` (переживает рестарт).
3. Дедуп по `(tx_hash, log_index)` в `onchain_deposits` — кредит ровно один раз.
4. На новый `Deposit` → `wallet.win` в Go-ledger (idempotency `deposit:{tx}:{logIndex}`).
5. Вывод: backend (owner) шлёт `withdraw` транзакцию через viem walletClient.

**Identity-маппинг (тестнет):** адрес кошелька = playerId в ledger (lowercased),
т.к. игрок и логинится по SIWE этим же адресом.

**Текущий статус:** код есть, typecheck чист, сервис стартует. Но **депозит не закредитовался**
в последнем тесте (ledger остался 0). Возможные причины для проверки в следующей сессии:
- курсор стартовал с `last_block=0`, а `getLogs` диапазон / confirmations off-by-one;
- listener поднялся ДО деплоя/депозита и `fromBlock` разъехался;
- адрес vault в env не совпал с фактически задеплоенным (передеплой менял адрес);
- поллинг-цикл словил ошибку и не продвинул курсор (надо смотреть лог `poll failed`).

→ **Это первое, что чинить в следующей сессии.** Диагностика: лог backend (`o.log`),
`SELECT * FROM onchain_deposits`, `SELECT last_block FROM onchain_cursor`, сверить адрес vault.

---

## 9. Как запускать (для следующей сессии)

### Инфраструктура
```bash
pnpm infra:up          # Postgres + Redis в Docker
pnpm install           # зависимости (если не стоят)
```

### Backend (NestJS)
```bash
# сборка
cd apps/backend && pnpm build
# запуск (Node 22 читает .env нативно):
node --env-file=.env dist/main.js
# health: http://localhost:4000/health, swagger: /docs
```

### Wallet (Go)
```bash
cd apps/wallet
# через go run (App Control блокирует собранные .exe — см. ниже):
DATABASE_URL=... WALLET_PORT=4100 WALLET_STORE=postgres go run ./cmd/server
# health: http://localhost:4100/health
```

### On-chain (Hardhat)
```bash
cd apps/contracts-evm
pnpm hardhat node                                   # локальная цепь :8545
pnpm hardhat run scripts/deploy.ts --network localhost   # деплой → deployments.local.json
pnpm hardhat test                                   # 5 тестов контрактов
```

### Smoke-тесты (воспроизводимая проверка)
```bash
cd apps/backend
node scripts/siwe-smoke.mjs    # auth end-to-end
node scripts/pf-smoke.mjs      # provably-fair lifecycle
node scripts/game-smoke.mjs    # игра end-to-end (нужны backend + wallet)
node scripts/slot-rtp-sim.mjs 1000000   # симуляция RTP
node scripts/slot-calibrate.mjs         # точный расчёт RTP / калибровка
```

### ⚠️ Грабли Windows-окружения (важно — много времени съели)
1. **Зомби-процессы на портах** (4000/4100/8545): фоновые серверы из `&` в Git Bash
   не умирают. Перед стартом: `netstat -ano | grep :PORT` → `taskkill /PID <pid> /F`,
   или PowerShell `Get-NetTCPConnection -LocalPort N | Stop-Process`.
2. **App Control блокирует запуск `.exe`** (и собранных, и тестовых из TEMP). →
   Go-сервисы гонять через `go run`; Go-тесты — `go test` (или компилировать в проект).
3. **`-race` в Go** требует CGO/gcc → на Windows падает. Гонять `go test` без `-race`.
4. **Git Bash `/tmp` ≠ Windows-путь** для `node`/`curl.exe`; PowerShell ломает inline-JSON. →
   JSON-тела в файлы по Windows-пути, слать `Invoke-RestMethod -InFile`.
5. **`nest build` + `incremental:true`** давал «отравленный» tsbuildinfo → выкидывал
   `dist/config`, `dist/shared`. Зафиксировано `incremental:false` + `deleteOutDir:true`.
6. **PowerShell** не понимает bash here-doc (`<<'MSG'`) и `try` как выражение — коммит-
   месседжи писать в файл и `git commit -F file`.

---

## 10. Главные технические решения и инварианты

- **Деньги — integer minor units (BigInt/int64)**, никаких float. Баланс выводится
  из неизменяемого журнала (double-entry), не редактируется напрямую.
- **Идемпотентность везде в деньгах:** каждая ledger-операция и каждый кредит депозита
  несут уникальный ключ → повтор/сетевой сбой не задваивает.
- **Provably-fair — единый источник честности:** игра НИКОГДА не крутит свой RNG,
  только `RoundRng`, сидированный из per-round секрета. После reveal любой может проверить.
- **Контракты-first (NestJS):** модули зависят от интерфейсов в `contracts/` через
  Symbol-токены, не друг от друга напрямую. Repository-порты для всех хранилищ.
- **Hexagonal DDD (Go):** домен ledger ничего не знает про pgx/HTTP; адаптеры реализуют
  порты, объявленные доменом.
- **Trust-модель on-chain (тестнет):** backend = владелец Vault, единолично авторизует
  вывод. Явно помечено как тестнетовое; продакшн требовал бы подписанных voucher'ов/multisig.
- **RTP — доказуемая математика:** точный перебор комбинаций == Монте-Карло симуляция ==
  агрегат в БД. Не «на глаз».

---

## 11. Что делать дальше (приоритет)

1. **F-3: починить listener** (раздел 8) — депозит on-chain должен кредитовать ledger.
   Доказать end-to-end: deposit on-chain → +баланс в ledger → играть → withdraw on-chain.
2. **F-4: связать с игрой** — задеплоить под env, прогнать полный цикл «занёс крипту → сыграл → вывел».
3. **Block G:** event bus (BullMQ/Redis) + подписчики (CRM/Risk/Reporting заглушки),
   observability (структурные логи, traceId), тесты (unit ledger/PF обязательны), CI.
4. **Frontend:** Next.js + wallet connect (wagmi) + SIWE-флоу + экран слота + verifier UI.
   Это же — портфолио/демо для собеса.
5. **Позже:** 243-ways слот 2-й игрой (доказать расширяемость фреймворка); RG-инструменты
   в UI (демо знания регуляций); деплой на Sepolia.

---

## 12. История коммитов (что когда сделано)

```
5f0e624  test(contracts-evm): on-chain smoke on local node (F-2)
e3033ca  feat(contracts-evm): CHIP ERC-20 + CasinoVault escrow (F-1)
f81689f  feat(game): generic Game Engine framework + RTP-calibrated slot (E)
e46d4bc  feat(provably-fair): commit-reveal seed lifecycle (D-3, closes D)
5fdd94e  feat(auth): real SIWE authentication with JWT + Postgres (D-2)
7df213a  feat(wallet): persist ledger in Postgres via pgx (D-1)
ca64599  fix(backend): pin rootDir so dist layout stays flat
6538b18  feat: scaffold all service skeletons with contracts (C)
d9f7593  chore: scaffold monorepo foundation (B)
```

> ⚠️ Блок F-3 (onchain listener) написан, но **НЕ закоммичен** — он в отладке.
> Незакоммиченные файлы: `infra/migrations/0005_onchain.sql`, `apps/backend/src/modules/onchain/*`,
> `apps/backend/src/contracts/data-providers/onchain-data-provider.contract.ts`,
> правки `env.schema.ts`, `migrate.ts`, `app.module.ts`,
> `apps/contracts-evm/scripts/{onchain-smoke,deposit-as-player}.ts`.
> Их нужно довести (раздел 8) и закоммитить как F-3.
