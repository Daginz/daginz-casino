import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type { PlayerId } from '@casino/contracts';
import { asPlayerId } from '@casino/contracts';
import type {
  IRefreshTokenDataProvider,
  StoredRefreshToken,
} from '@/contracts/data-providers/refresh-token-data-provider.contract';
import { PG_POOL } from '@/shared/db/db.module';

interface RefreshRow {
  id: string;
  player_id: string;
  expires_at: Date;
  revoked_at: Date | null;
}

@Injectable()
export class PostgresRefreshTokenDataProvider implements IRefreshTokenDataProvider {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async create(input: { playerId: PlayerId; tokenHash: string; expiresAt: Date }): Promise<void> {
    await this.pool.query(
      `INSERT INTO refresh_tokens (player_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [input.playerId, input.tokenHash, input.expiresAt],
    );
  }

  async findActiveByHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    const { rows } = await this.pool.query<RefreshRow>(
      `SELECT id, player_id, expires_at, revoked_at
         FROM refresh_tokens
        WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
      [tokenHash],
    );
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async findByHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    const { rows } = await this.pool.query<RefreshRow>(
      `SELECT id, player_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1`,
      [tokenHash],
    );
    return rows[0] ? this.toDomain(rows[0]) : null;
  }

  async revokeByHash(tokenHash: string): Promise<void> {
    await this.pool.query(
      `UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash],
    );
  }

  async revokeAllForPlayer(playerId: PlayerId): Promise<void> {
    await this.pool.query(
      `UPDATE refresh_tokens SET revoked_at = now() WHERE player_id = $1 AND revoked_at IS NULL`,
      [playerId],
    );
  }

  private toDomain(row: RefreshRow): StoredRefreshToken {
    return {
      id: row.id,
      playerId: asPlayerId(row.player_id),
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
    };
  }
}
