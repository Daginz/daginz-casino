import { envSchema, type Env } from './env.schema';

/**
 * Parse process.env once at module load. Throws (fail-fast) if invalid,
 * so the app never boots with a misconfigured environment.
 */
function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return result.data;
}

export const env: Env = loadEnv();
