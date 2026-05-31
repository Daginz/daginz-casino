import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type { PlayerId } from '@casino/contracts';
import { asPlayerId } from '@casino/contracts';
import type {
  ISeedDataProvider,
  SeedPair,
} from '@/contracts/data-providers/seed-data-provider.contract';
import { PG_POOL } from '@/shared/db/db.module';

interface SeedRow {
  id: string;
  player_id: string;
  server_seed: string;
  server_seed_hash: string;
  client_seed: string;
  nonce: number;
  status: 'active' | 'revealed';
}

@Injectable()
export class PostgresSeedDataProvider implements ISeedDataProvider {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findActive(playerId: PlayerId): Promise<SeedPair | null> {
    const { rows } = await this.pool.query<SeedRow>(
      `SELECT * FROM pf_seeds WHERE player_id = $1 AND status = 'active'`,
      [playerId],
    );
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  async createActive(input: {
    playerId: PlayerId;
    serverSeed: string;
    serverSeedHash: string;
    clientSeed: string;
  }): Promise<SeedPair> {
    const { rows } = await this.pool.query<SeedRow>(
      `INSERT INTO pf_seeds (player_id, server_seed, server_seed_hash, client_seed)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.playerId, input.serverSeed, input.serverSeedHash, input.clientSeed],
    );
    return this.toDomain(this.requireRow(rows[0]));
  }

  /**
   * Atomic read-and-increment via UPDATE ... RETURNING with the pre-increment
   * nonce. A single statement = no race; matches the "draw" semantic.
   */
  async drawNonce(playerId: PlayerId): Promise<SeedPair | null> {
    const { rows } = await this.pool.query<SeedRow>(
      `UPDATE pf_seeds
         SET nonce = nonce + 1
       WHERE player_id = $1 AND status = 'active'
       RETURNING id, player_id, server_seed, server_seed_hash, client_seed,
                 nonce - 1 AS nonce, status`,
      [playerId],
    );
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  async revealActive(playerId: PlayerId): Promise<SeedPair | null> {
    const { rows } = await this.pool.query<SeedRow>(
      `UPDATE pf_seeds
         SET status = 'revealed', revealed_at = now()
       WHERE player_id = $1 AND status = 'active'
       RETURNING *`,
      [playerId],
    );
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  private requireRow(row: SeedRow | undefined): SeedRow {
    if (!row) throw new Error('seed insert returned no row');
    return row;
  }

  private toDomain(row: SeedRow): SeedPair {
    return {
      id: row.id,
      playerId: asPlayerId(row.player_id),
      serverSeed: row.server_seed,
      serverSeedHash: row.server_seed_hash,
      clientSeed: row.client_seed,
      nonce: row.nonce,
      status: row.status,
    };
  }
}
