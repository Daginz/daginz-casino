import { Injectable } from '@nestjs/common';
import type { PlayerId } from '@casino/contracts';
import { asPlayerId } from '@casino/contracts';
import type { Balance, IWalletService, LedgerOp } from '@/contracts/wallet.contract';
import { err, ok, type Result } from '@/shared/result';
import {
  DomainError,
  ExternalServiceError,
  InsufficientFundsError,
} from '@/shared/errors/domain-error';
import { env } from '@/config/env';

interface BalanceResponse {
  playerId: string;
  amount: number;
}

/**
 * Adapter: backend's HTTP client to the Go Wallet/Ledger service (:4100).
 * Maps the wallet's 409 (insufficient funds) to an InsufficientFundsError and
 * any transport/5xx failure to an ExternalServiceError — never silently ok.
 */
@Injectable()
export class HttpWalletProvider implements IWalletService {
  private readonly baseUrl = env.WALLET_URL;

  async getBalance(playerId: PlayerId): Promise<Result<Balance, DomainError>> {
    return this.requestBalance(`/ledger/${encodeURIComponent(playerId)}/balance`, { method: 'GET' });
  }

  async bet(op: LedgerOp): Promise<Result<Balance, DomainError>> {
    return this.requestBalance('/ledger/bet', this.opInit(op));
  }

  async win(op: LedgerOp): Promise<Result<Balance, DomainError>> {
    return this.requestBalance('/ledger/win', this.opInit(op));
  }

  async rollback(idempotencyKey: string): Promise<Result<Balance, DomainError>> {
    // Reverses a prior op via a compensating ledger entry (Go /ledger/rollback).
    return this.requestBalance('/ledger/rollback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idempotencyKey }),
    });
  }

  private opInit(op: LedgerOp): RequestInit {
    return {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        playerId: op.playerId,
        amount: Number(op.amount),
        idempotencyKey: op.idempotencyKey,
        reference: op.reference,
      }),
    };
  }

  private async requestBalance(
    path: string,
    init: RequestInit,
  ): Promise<Result<Balance, DomainError>> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, init);
    } catch (cause) {
      return err(new ExternalServiceError(`Wallet service unreachable: ${String(cause)}`));
    }

    if (res.status === 409) {
      return err(new InsufficientFundsError('Insufficient funds'));
    }
    if (!res.ok) {
      return err(new ExternalServiceError(`Wallet service error ${res.status}`));
    }

    const body = (await res.json()) as BalanceResponse;
    return ok({ playerId: asPlayerId(body.playerId), amount: BigInt(body.amount) });
  }
}
