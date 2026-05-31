import { Injectable } from '@nestjs/common';
import type { PlayerId } from '@casino/contracts';
import type {
  Balance,
  IWalletService,
  LedgerOp,
} from '@/contracts/wallet.contract';
import { ok, type Result } from '@/shared/result';
import type { DomainError } from '@/shared/errors/domain-error';

/**
 * Adapter: backend's client to the Go Wallet service — STUB (Block C).
 * Block D replaces the bodies with real HTTP/gRPC calls to :4100.
 */
@Injectable()
export class HttpWalletProvider implements IWalletService {
  async getBalance(playerId: PlayerId): Promise<Result<Balance, DomainError>> {
    return ok({ playerId, amount: 0n });
  }

  async bet(op: LedgerOp): Promise<Result<Balance, DomainError>> {
    return ok({ playerId: op.playerId, amount: 0n });
  }

  async win(op: LedgerOp): Promise<Result<Balance, DomainError>> {
    return ok({ playerId: op.playerId, amount: 0n });
  }

  async rollback(_idempotencyKey: string): Promise<Result<Balance, DomainError>> {
    return ok({ playerId: 'stub' as PlayerId, amount: 0n });
  }
}
