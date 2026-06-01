import { asPlayerId, asWalletAddress } from '@casino/contracts';
import { OnchainWithdrawService } from './onchain-withdraw.service';
import { OnchainListenerService } from './onchain-listener.service';
import type { IWalletService } from '@/contracts/wallet.contract';
import type { IEventBus } from '@/contracts/events.contract';
import { ok, err } from '@/shared/result';
import { InsufficientFundsError } from '@/shared/errors/domain-error';

const PLAYER = asPlayerId('0x70997970c51812dc3a010c7d01b50e0d17dc79c8');
const ADDR = asWalletAddress('0x70997970c51812dc3a010c7d01b50e0d17dc79c8');

function setup() {
  const wallet = {
    getBalance: jest.fn(),
    bet: jest.fn(),
    win: jest.fn(),
    rollback: jest.fn(),
  } as unknown as jest.Mocked<IWalletService>;
  const events: IEventBus = { publish: jest.fn().mockResolvedValue(undefined) };
  const listener = { sendWithdrawal: jest.fn() } as unknown as jest.Mocked<OnchainListenerService>;
  const logger = { log: jest.fn(), error: jest.fn() };

  const service = new OnchainWithdrawService(wallet, events, listener, logger as never);
  return { service, wallet, events, listener };
}

describe('OnchainWithdrawService.withdraw', () => {
  it('debits the ledger, sends the tx, and returns the hash on success', async () => {
    const { service, wallet, listener } = setup();
    wallet.bet.mockResolvedValue(ok({ playerId: PLAYER, amount: 0n }));
    listener.sendWithdrawal.mockResolvedValue('0xdeadbeef');

    const result = await service.withdraw(PLAYER, ADDR, 50n);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.txHash).toBe('0xdeadbeef');
    expect(wallet.bet).toHaveBeenCalledTimes(1); // debited once
    expect(listener.sendWithdrawal).toHaveBeenCalledTimes(1);
    expect(wallet.win).not.toHaveBeenCalled(); // no refund on success
  });

  it('rejects a non-positive amount before touching the ledger', async () => {
    const { service, wallet, listener } = setup();
    const result = await service.withdraw(PLAYER, ADDR, 0n);
    expect(result.ok).toBe(false);
    expect(wallet.bet).not.toHaveBeenCalled();
    expect(listener.sendWithdrawal).not.toHaveBeenCalled();
  });

  it('fails fast without sending a tx when the ledger debit is short', async () => {
    const { service, wallet, listener } = setup();
    wallet.bet.mockResolvedValue(err(new InsufficientFundsError('Insufficient funds')));

    const result = await service.withdraw(PLAYER, ADDR, 1_000_000n);

    expect(result.ok).toBe(false);
    expect(listener.sendWithdrawal).not.toHaveBeenCalled(); // never sent
    expect(wallet.win).not.toHaveBeenCalled(); // nothing to refund
  });

  it('REFUNDS the ledger if the on-chain send fails (money safety)', async () => {
    const { service, wallet, listener } = setup();
    wallet.bet.mockResolvedValue(ok({ playerId: PLAYER, amount: 0n }));
    wallet.win.mockResolvedValue(ok({ playerId: PLAYER, amount: 50n }));
    listener.sendWithdrawal.mockRejectedValue(new Error('rpc down'));

    const result = await service.withdraw(PLAYER, ADDR, 50n);

    expect(result.ok).toBe(false); // surfaced as an error
    expect(wallet.bet).toHaveBeenCalledTimes(1); // debited
    expect(wallet.win).toHaveBeenCalledTimes(1); // refunded back
    const refund = wallet.win.mock.calls[0]?.[0];
    expect(refund?.amount).toBe(50n);
    expect(refund?.idempotencyKey).toMatch(/^withdraw-refund:/);
  });
});
