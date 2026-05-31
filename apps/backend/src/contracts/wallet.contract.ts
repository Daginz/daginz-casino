import type { PlayerId } from '@casino/contracts';
import type { Result } from '@/shared/result';
import type { DomainError } from '@/shared/errors/domain-error';

/**
 * The backend's port to the Go Wallet/Ledger service.
 * Implemented by an adapter (HTTP/gRPC client) in modules/wallet/providers.
 * Amounts are integer minor units (testnet credits) to avoid float drift.
 */
export const WALLET_SERVICE = Symbol('WALLET_SERVICE');

export interface Balance {
  playerId: PlayerId;
  amount: bigint;
}

export interface LedgerOp {
  playerId: PlayerId;
  amount: bigint;
  /** Idempotency key — same key never applies twice. */
  idempotencyKey: string;
  /** Free-form reference, e.g. the game round id. */
  reference: string;
}

export interface IWalletService {
  getBalance(playerId: PlayerId): Promise<Result<Balance, DomainError>>;
  /** Debit a stake. */
  bet(op: LedgerOp): Promise<Result<Balance, DomainError>>;
  /** Credit a win. */
  win(op: LedgerOp): Promise<Result<Balance, DomainError>>;
  /** Reverse a prior op by its idempotency key. */
  rollback(idempotencyKey: string): Promise<Result<Balance, DomainError>>;
}
