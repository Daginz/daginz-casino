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

  // SIWE (Sign-In With Ethereum) — used in Block D
  SIWE_DOMAIN: z.string().default('localhost:3000'),
  SIWE_STATEMENT: z.string().default('Sign in to Casino (testnet)'),

  // Wallet (Go) service base URL — the backend calls it for ledger ops.
  WALLET_URL: z.string().url().default('http://localhost:4100'),
});

export type Env = z.infer<typeof envSchema>;
