// Minimal env for unit tests that import config/env (parsed at module load).
// These are never used to connect — tests mock all I/O behind Symbol tokens.
process.env.DATABASE_URL ??= 'postgres://test:test@localhost:5432/test';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.JWT_SECRET ??= 'test-jwt-secret-not-used';
process.env.NODE_ENV ??= 'test';
