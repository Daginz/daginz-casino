import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type { WalletAddress } from '@casino/contracts';
import { asPlayerId } from '@casino/contracts';
import type { Player } from '@/contracts/auth.contract';
import type { IPlayerDataProvider } from '@/contracts/data-providers/player-data-provider.contract';
import { PG_POOL } from '@/shared/db/db.module';

interface PlayerRow {
  id: string;
  wallet_address: string;
  created_at: Date;
}

@Injectable()
export class PostgresPlayerDataProvider implements IPlayerDataProvider {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async upsertByAddress(address: WalletAddress): Promise<Player> {
    const normalized = address.toLowerCase();
    const { rows } = await this.pool.query<PlayerRow>(
      `INSERT INTO players (wallet_address) VALUES ($1)
       ON CONFLICT (wallet_address) DO UPDATE SET wallet_address = EXCLUDED.wallet_address
       RETURNING id, wallet_address, created_at`,
      [normalized],
    );
    return this.toDomain(this.requireRow(rows[0]));
  }

  async findById(id: string): Promise<Player | null> {
    const { rows } = await this.pool.query<PlayerRow>(
      `SELECT id, wallet_address, created_at FROM players WHERE id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  private requireRow(row: PlayerRow | undefined): PlayerRow {
    if (!row) throw new Error('player upsert returned no row');
    return row;
  }

  private toDomain(row: PlayerRow): Player {
    return {
      id: asPlayerId(row.id),
      walletAddress: row.wallet_address as WalletAddress,
      createdAt: row.created_at,
    };
  }
}
