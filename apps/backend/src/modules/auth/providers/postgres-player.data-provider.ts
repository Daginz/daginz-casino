import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type { WalletAddress } from '@casino/contracts';
import { asPlayerId } from '@casino/contracts';
import type { Player } from '@/contracts/auth.contract';
import type { IPlayerDataProvider } from '@/contracts/data-providers/player-data-provider.contract';
import { PG_POOL } from '@/shared/db/db.module';

interface PlayerRow {
  id: string; // lowercased wallet address (the player's single identity)
  created_at: Date;
}

@Injectable()
export class PostgresPlayerDataProvider implements IPlayerDataProvider {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async upsertByAddress(address: WalletAddress): Promise<Player> {
    const id = address.toLowerCase();
    const { rows } = await this.pool.query<PlayerRow>(
      `INSERT INTO players (id) VALUES ($1)
       ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id
       RETURNING id, created_at`,
      [id],
    );
    return this.toDomain(this.requireRow(rows[0]));
  }

  async findById(id: string): Promise<Player | null> {
    const { rows } = await this.pool.query<PlayerRow>(
      `SELECT id, created_at FROM players WHERE id = $1`,
      [id.toLowerCase()],
    );
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  private requireRow(row: PlayerRow | undefined): PlayerRow {
    if (!row) throw new Error('player upsert returned no row');
    return row;
  }

  private toDomain(row: PlayerRow): Player {
    // id and walletAddress are the same value now (the address).
    return {
      id: asPlayerId(row.id),
      walletAddress: row.id as WalletAddress,
      createdAt: row.created_at,
    };
  }
}
