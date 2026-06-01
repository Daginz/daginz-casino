import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { keccak256, toHex, type Address } from 'viem';
import type { PlayerId, WalletAddress } from '@casino/contracts';
import { WALLET_SERVICE, type IWalletService } from '@/contracts/wallet.contract';
import { err, ok, type Result } from '@/shared/result';
import {
  ExternalServiceError,
  ValidationError,
  type DomainError,
} from '@/shared/errors/domain-error';
import { OnchainListenerService } from './onchain-listener.service';

export interface WithdrawResult {
  withdrawalId: string;
  txHash: string;
  chipAmount: string;
}

/**
 * Withdraw flow (off-chain ledger -> on-chain CHIP):
 *   1. debit the player's ledger balance (wallet.bet) — fails fast if short,
 *   2. send the on-chain withdraw tx (vault owner releases CHIP),
 *   3. if the tx send fails, REFUND the ledger debit (credit back).
 * This keeps the ledger and chain consistent: money only leaves the ledger if
 * it actually left the vault.
 */
@Injectable()
export class OnchainWithdrawService {
  private readonly logger = new Logger(OnchainWithdrawService.name);

  constructor(
    @Inject(WALLET_SERVICE) private readonly wallet: IWalletService,
    private readonly listener: OnchainListenerService,
  ) {}

  async withdraw(
    playerId: PlayerId,
    address: WalletAddress,
    chipAmount: bigint,
  ): Promise<Result<WithdrawResult, DomainError>> {
    if (chipAmount <= 0n) return err(new ValidationError('Withdraw amount must be positive'));

    // Unique id, also used as the on-chain withdrawalId (bytes32) and the
    // ledger idempotency key so a retry can't double-debit.
    const raw = randomBytes(16).toString('hex');
    const withdrawalId = keccak256(toHex(`withdraw:${playerId}:${raw}`));

    // 1. Debit ledger (this is a "bet"-style debit; 409 if insufficient).
    const debit = await this.wallet.bet({
      playerId,
      amount: chipAmount,
      idempotencyKey: `withdraw:${withdrawalId}`,
      reference: 'onchain-withdraw',
    });
    if (!debit.ok) return err(debit.error);

    // 2. Send on-chain. On failure, refund the ledger so balances stay sound.
    try {
      const txHash = await this.listener.sendWithdrawal(
        address as Address,
        chipAmount,
        withdrawalId,
      );
      this.logger.log(`withdraw ${chipAmount} CHIP to ${address} tx=${txHash}`);
      return ok({ withdrawalId, txHash, chipAmount: chipAmount.toString() });
    } catch (cause) {
      this.logger.error(`on-chain withdraw failed, refunding ledger: ${String(cause)}`);
      await this.wallet.win({
        playerId,
        amount: chipAmount,
        idempotencyKey: `withdraw-refund:${withdrawalId}`,
        reference: 'onchain-withdraw-refund',
      });
      return err(new ExternalServiceError('On-chain withdrawal failed; balance refunded'));
    }
  }
}
