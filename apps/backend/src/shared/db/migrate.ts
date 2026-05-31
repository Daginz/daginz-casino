import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Pool } from 'pg';

/**
 * Minimal migration runner for backend-owned tables. Applies *.sql from
 * infra/migrations in lexical order, tracked in schema_migrations.
 * The wallet (Go) owns ledger migrations; the backend owns the rest.
 * We scope by an allowlist so the two services don't fight over files.
 */
const BACKEND_MIGRATIONS = [
  '0002_players.sql',
  '0003_provably_fair_seeds.sql',
  '0004_game_rounds.sql',
];

export async function runMigrations(pool: Pool, migrationsDir: string): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql') && BACKEND_MIGRATIONS.includes(f))
    .sort();

  for (const name of files) {
    const { rows } = await pool.query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE name = $1) AS exists',
      [name],
    );
    if (rows[0]?.exists) continue;

    const sql = await readFile(join(migrationsDir, name), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
