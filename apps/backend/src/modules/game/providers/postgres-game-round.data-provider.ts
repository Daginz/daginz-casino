import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type { GameRoundId, PlayerId } from '@casino/contracts';
import { asGameRoundId, asPlayerId } from '@casino/contracts';
import type {
  IGameRoundDataProvider,
  StoredRound,
} from '@/contracts/data-providers/game-round-data-provider.contract';
import { PG_POOL } from '@/shared/db/db.module';

interface RoundRow {
  id: string;
  player_id: string;
  game: string;
  stake: string;
  payout: string;
  outcome: number;
  server_seed_hash: string;
  client_seed: string;
  nonce: number;
  detail: unknown;
  created_at: Date;
}

@Injectable()
export class PostgresGameRoundDataProvider implements IGameRoundDataProvider {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async save(round: Omit<StoredRound, 'id' | 'createdAt'>): Promise<StoredRound> {
    const { rows } = await this.pool.query<RoundRow>(
      `INSERT INTO game_rounds
         (player_id, game, stake, payout, outcome, server_seed_hash, client_seed, nonce, detail)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        round.playerId,
        round.game,
        round.stake.toString(),
        round.payout.toString(),
        round.outcome,
        round.serverSeedHash,
        round.clientSeed,
        round.nonce,
        JSON.stringify(round.detail),
      ],
    );
    return this.toDomain(this.requireRow(rows[0]));
  }

  async findById(id: GameRoundId): Promise<StoredRound | null> {
    const { rows } = await this.pool.query<RoundRow>(
      `SELECT * FROM game_rounds WHERE id = $1`,
      [id],
    );
    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  async listByPlayer(playerId: PlayerId, limit: number): Promise<StoredRound[]> {
    const { rows } = await this.pool.query<RoundRow>(
      `SELECT * FROM game_rounds WHERE player_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [playerId, limit],
    );
    return rows.map((r) => this.toDomain(r));
  }

  private requireRow(row: RoundRow | undefined): RoundRow {
    if (!row) throw new Error('game_round insert returned no row');
    return row;
  }

  private toDomain(row: RoundRow): StoredRound {
    return {
      id: asGameRoundId(row.id),
      playerId: asPlayerId(row.player_id),
      game: row.game,
      stake: BigInt(row.stake),
      payout: BigInt(row.payout),
      outcome: row.outcome,
      serverSeedHash: row.server_seed_hash,
      clientSeed: row.client_seed,
      nonce: row.nonce,
      detail: row.detail,
      createdAt: row.created_at,
    };
  }
}
