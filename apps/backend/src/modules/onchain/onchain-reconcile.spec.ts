import { Test } from '@nestjs/testing';
import { asPlayerId } from '@casino/contracts';
import { OnchainListenerService } from './onchain-listener.service';
import { WALLET_SERVICE, type IWalletService } from '@/contracts/wallet.contract';
import { EVENT_BUS, type IEventBus } from '@/contracts/events.contract';
import {
  ONCHAIN_DATA_PROVIDER,
  type IOnchainDataProvider,
  type DepositEventRecord,
} from '@/contracts/data-providers/onchain-data-provider.contract';
import { ok, err } from '@/shared/result';
import { ExternalServiceError } from '@/shared/errors/domain-error';

/**
 * The reconcile pass must retry crediting deposits that were recorded but not
 * credited (a credit that failed mid-flight), and must mark them credited once
 * the ledger accepts them — without double-crediting.
 */
function makeRecord(over: Partial<DepositEventRecord> = {}): DepositEventRecord {
  return {
    txHash: '0xabc',
    logIndex: 0,
    playerAddr: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    amount: 100_000000000000000000n, // 100 CHIP in wei
    nonce: 0n,
    ...over,
  };
}

describe('OnchainListenerService.reconcile', () => {
  let listener: OnchainListenerService;
  let store: jest.Mocked<IOnchainDataProvider>;
  let wallet: jest.Mocked<IWalletService>;

  beforeEach(async () => {
    store = {
      getCursor: jest.fn(),
      setCursor: jest.fn(),
      recordDepositIfNew: jest.fn(),
      markDepositCredited: jest.fn().mockResolvedValue(undefined),
      listUncreditedDeposits: jest.fn(),
      createWithdrawal: jest.fn(),
      markWithdrawalSent: jest.fn(),
      markWithdrawalFailed: jest.fn(),
    } as unknown as jest.Mocked<IOnchainDataProvider>;

    wallet = {
      getBalance: jest.fn(),
      bet: jest.fn(),
      win: jest.fn(),
      rollback: jest.fn(),
    } as unknown as jest.Mocked<IWalletService>;

    const events: IEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OnchainListenerService,
        { provide: WALLET_SERVICE, useValue: wallet },
        { provide: ONCHAIN_DATA_PROVIDER, useValue: store },
        { provide: EVENT_BUS, useValue: events },
      ],
    }).compile();

    listener = moduleRef.get(OnchainListenerService);
  });

  it('credits an uncredited deposit and marks it credited', async () => {
    store.listUncreditedDeposits.mockResolvedValue([makeRecord()]);
    wallet.win.mockResolvedValue(ok({ playerId: asPlayerId('0x..'), amount: 100n }));

    await listener.reconcile();

    expect(wallet.win).toHaveBeenCalledTimes(1);
    // Idempotent credit key derived from tx + logIndex.
    expect(wallet.win).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: 'deposit:0xabc:0', amount: 100n }),
    );
    expect(store.markDepositCredited).toHaveBeenCalledWith('0xabc', 0);
  });

  it('does NOT mark credited when the ledger credit fails (retries next pass)', async () => {
    store.listUncreditedDeposits.mockResolvedValue([makeRecord()]);
    wallet.win.mockResolvedValue(err(new ExternalServiceError('wallet down')));

    await listener.reconcile();

    expect(wallet.win).toHaveBeenCalledTimes(1);
    expect(store.markDepositCredited).not.toHaveBeenCalled();
  });

  it('is a no-op when there is nothing to reconcile', async () => {
    store.listUncreditedDeposits.mockResolvedValue([]);

    await listener.reconcile();

    expect(wallet.win).not.toHaveBeenCalled();
    expect(store.markDepositCredited).not.toHaveBeenCalled();
  });
});
