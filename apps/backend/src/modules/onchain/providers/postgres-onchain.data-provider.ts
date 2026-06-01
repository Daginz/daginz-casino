import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import type {
  DepositEventRecord,
  IOnchainDataProvider,
} from '@/contracts/data-providers/onchain-data-provider.contract';
import { PG_POOL } from '@/shared/db/db.module';

@Injectable()
export class PostgresOnchainDataProvider implements IOnchainDataProvider {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getCursor(): Promise<number> {
    const { rows } = await this.pool.query<{ last_block: string }>(
      `SELECT last_block FROM onchain_cursor WHERE id = 1`,
    );
    return rows[0] ? Number(rows[0].last_block) : 0;
  }

  async setCursor(block: number): Promise<void> {
    await this.pool.query(
      `UPDATE onchain_cursor SET last_block = $1, updated_at = now() WHERE id = 1`,
      [block],
    );
  }

  async recordDepositIfNew(ev: DepositEventRecord): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      `INSERT INTO onchain_deposits (tx_hash, log_index, player_addr, amount, nonce)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tx_hash, log_index) DO NOTHING`,
      [ev.txHash, ev.logIndex, ev.playerAddr.toLowerCase(), ev.amount.toString(), ev.nonce.toString()],
    );
    return rowCount === 1;
  }

  async markDepositCredited(txHash: string, logIndex: number): Promise<void> {
    await this.pool.query(
      `UPDATE onchain_deposits SET credited = true WHERE tx_hash = $1 AND log_index = $2`,
      [txHash, logIndex],
    );
  }

  async createWithdrawal(id: string, playerAddr: string, amount: bigint): Promise<void> {
    await this.pool.query(
      `INSERT INTO onchain_withdrawals (withdrawal_id, player_addr, amount)
       VALUES ($1, $2, $3) ON CONFLICT (withdrawal_id) DO NOTHING`,
      [id, playerAddr.toLowerCase(), amount.toString()],
    );
  }

  async markWithdrawalSent(id: string, txHash: string): Promise<void> {
    await this.pool.query(
      `UPDATE onchain_withdrawals SET status = 'sent', tx_hash = $2 WHERE withdrawal_id = $1`,
      [id, txHash],
    );
  }

  async markWithdrawalFailed(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE onchain_withdrawals SET status = 'failed' WHERE withdrawal_id = $1`,
      [id],
    );
  }
}
