# E2E tests — live testnet stack

End-to-end tests that exercise the **whole vertical** against a running stack:
SIWE auth, the on-chain faucet/deposit, the off-chain listener that credits the
ledger, the provably-fair slot, and owner-signed withdrawals. A green run is
proof the testnet product actually works — not just the units.

These are **integration** tests: they need the stack up. They are intentionally
kept out of the unit-test CI lanes (which run with no chain/DB).

## Run

```bash
# 1. Bring the full stack up (from repo root)
docker compose up --build -d

# 2. Run the suite
pnpm --filter @casino/e2e test
```

Override targets via env if not on the defaults:
`E2E_API_URL` (default `http://localhost:4000`), `E2E_RPC_URL`
(default `http://localhost:8545`).

## What's covered

| File | Scenarios |
|---|---|
| `01-auth.test.mjs` | SIWE challenge→sign→verify→JWT; `/auth/me`; nonce replay rejected; protected route needs a token |
| `02-cashier.test.mjs` | faucet (+1000 on-chain); deposit → listener credits ledger; withdraw debits ledger + releases on-chain; over-balance withdraw rejected |
| `03-game-fairness.test.mjs` | spin debits stake/credits payout; grid 3×3 + win lines are genuine; 15-spin ledger consistency; provably-fair recompute matches byte-for-byte; tampered outcome fails verify |

The suite uses the well-known Hardhat dev account #1 (a public testnet key) and
the same SIWE / contract calls the real frontend makes.
