import { z } from 'zod';

/**
 * Environment schema — parsed once at startup, fail-fast.
 * Per global rules: validate all boundaries with Zod, no implicit `any`.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  BACKEND_PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  JWT_SECRET: z.string().min(8),

  // Refresh-token lifetime (opaque token, HTTP-only cookie). Default 30 days.
  REFRESH_TTL_MS: z.coerce.number().int().positive().default(30 * 24 * 60 * 60 * 1000),
  // Mark the refresh cookie Secure (HTTPS only) — enable in production.
  AUTH_COOKIE_SECURE: z.coerce.boolean().default(false),

  // SIWE (Sign-In With Ethereum) — used in Block D
  SIWE_DOMAIN: z.string().default('localhost:3000'),
  SIWE_STATEMENT: z.string().default('Sign in to Casino (testnet)'),

  // Wallet (Go) service base URL — the backend calls it for ledger ops.
  WALLET_URL: z.string().url().default('http://localhost:4100'),

  // Rate limiting. Global default + per-area overrides, all env-tunable so the
  // demo/e2e stack can relax them (real prod would tighten via env).
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
  // Auth (brute-force sensitive) — per THROTTLE_TTL_MS window.
  THROTTLE_AUTH_LIMIT: z.coerce.number().int().positive().default(20),
  // Spins — per 10s window.
  THROTTLE_PLAY_LIMIT: z.coerce.number().int().positive().default(50),

  // ── On-chain listener (Block F) ───────────────────────────────────
  // Enable the listener; off by default so the app boots without a chain.
  ONCHAIN_ENABLED: z.coerce.boolean().default(false),
  ONCHAIN_RPC_URL: z.string().url().default('http://127.0.0.1:8545'),
  ONCHAIN_CHAIN_ID: z.coerce.number().int().positive().default(31337),
  ONCHAIN_VAULT_ADDRESS: z.string().default(''),
  ONCHAIN_CHIP_ADDRESS: z.string().default(''),
  // Reconcile cadence: retry crediting recorded-but-uncredited deposits whose
  // ledger credit failed mid-flight. Default 30s.
  ONCHAIN_RECONCILE_MS: z.coerce.number().int().positive().default(30_000),
  // Owner key that signs withdrawal txs (testnet only; never a real key here).
  ONCHAIN_OWNER_KEY: z.string().default(''),
  // Poll cadence + confirmations before crediting a deposit.
  ONCHAIN_POLL_MS: z.coerce.number().int().positive().default(3000),
  ONCHAIN_CONFIRMATIONS: z.coerce.number().int().nonnegative().default(1),
});

export type Env = z.infer<typeof envSchema>;
