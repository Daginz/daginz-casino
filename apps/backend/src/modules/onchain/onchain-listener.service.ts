import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbiItem,
  type Address,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { asPlayerId } from '@casino/contracts';
import { WALLET_SERVICE, type IWalletService } from '@/contracts/wallet.contract';
import { EVENT_BUS, type IEventBus } from '@/contracts/events.contract';
import {
  ONCHAIN_DATA_PROVIDER,
  type IOnchainDataProvider,
} from '@/contracts/data-providers/onchain-data-provider.contract';
import { env } from '@/config/env';
import { VAULT_ABI } from './vault.abi';
import { chipToWei, weiToChip } from './units';

const DEPOSIT_EVENT = parseAbiItem(
  'event Deposit(address indexed player, uint256 amount, uint256 nonce)',
);

/**
 * Polls the chain for CasinoVault Deposit events and credits the off-chain
 * ledger, exactly once per event (dedupe by tx_hash+log_index, cursor in
 * Postgres so restarts don't miss or double-count). Also sends withdrawal
 * transactions as the vault owner.
 *
 * Identity mapping (testnet): the wallet address IS the player id in our
 * ledger — players authenticate with SIWE using that address, so crediting
 * `playerId = address.toLowerCase()` lines up with how rounds debit them.
 */
@Injectable()
export class OnchainListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OnchainListenerService.name);
  private timer: NodeJS.Timeout | null = null;
  private reconcileTimer: NodeJS.Timeout | null = null;
  private running = false;
  private reconciling = false;
  private readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient | null;
  private readonly vault: Address;

  constructor(
    @Inject(WALLET_SERVICE) private readonly wallet: IWalletService,
    @Inject(ONCHAIN_DATA_PROVIDER) private readonly store: IOnchainDataProvider,
    @Inject(EVENT_BUS) private readonly events: IEventBus,
  ) {
    this.vault = env.ONCHAIN_VAULT_ADDRESS as Address;
    this.publicClient = createPublicClient({ transport: http(env.ONCHAIN_RPC_URL) });
    this.walletClient = env.ONCHAIN_OWNER_KEY
      ? createWalletClient({
          account: privateKeyToAccount(env.ONCHAIN_OWNER_KEY as `0x${string}`),
          transport: http(env.ONCHAIN_RPC_URL),
        })
      : null;
  }

  onModuleInit(): void {
    if (!env.ONCHAIN_ENABLED) {
      this.logger.log('On-chain listener disabled (ONCHAIN_ENABLED=false)');
      return;
    }
    this.logger.log(`On-chain listener started; vault=${this.vault} rpc=${env.ONCHAIN_RPC_URL}`);
    this.schedule();
    this.scheduleReconcile();
  }

  onModuleDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
    if (this.reconcileTimer) clearTimeout(this.reconcileTimer);
  }

  private schedule(): void {
    this.timer = setTimeout(() => {
      void this.poll().finally(() => this.schedule());
    }, env.ONCHAIN_POLL_MS);
  }

  private scheduleReconcile(): void {
    this.reconcileTimer = setTimeout(() => {
      void this.reconcile().finally(() => this.scheduleReconcile());
    }, env.ONCHAIN_RECONCILE_MS);
  }

  /**
   * Retry crediting deposits that were recorded (dedupe row written) but whose
   * ledger credit didn't land — e.g. the wallet service was down at the moment
   * the event was first seen. Idempotent: the credit uses the same key, so a
   * deposit can never be double-credited even if the live handler also retries.
   */
  async reconcile(): Promise<void> {
    if (this.reconciling) return;
    this.reconciling = true;
    try {
      const pending = await this.store.listUncreditedDeposits(50);
      if (pending.length === 0) return;
      this.logger.log(`reconcile: ${pending.length} uncredited deposit(s) to retry`);
      for (const dep of pending) {
        await this.creditDeposit(dep);
      }
    } catch (err) {
      this.logger.error(`reconcile failed: ${String(err)}`);
    } finally {
      this.reconciling = false;
    }
  }

  /** One poll cycle: scan new blocks for Deposit events and credit them. */
  async poll(): Promise<void> {
    if (this.running) return; // never overlap cycles
    this.running = true;
    try {
      const head = Number(await this.publicClient.getBlockNumber());
      const safeHead = head - env.ONCHAIN_CONFIRMATIONS;
      const from = (await this.store.getCursor()) + 1;
      if (safeHead < from) return; // nothing new (with confirmations)

      const logs = await this.publicClient.getLogs({
        address: this.vault,
        event: DEPOSIT_EVENT,
        fromBlock: BigInt(from),
        toBlock: BigInt(safeHead),
      });

      for (const log of logs) {
        await this.handleDeposit(log);
      }
      await this.store.setCursor(safeHead);
    } catch (err) {
      // Never advance the cursor on failure — the same range retries next tick.
      this.logger.error(`poll failed: ${String(err)}`);
    } finally {
      this.running = false;
    }
  }

  private async handleDeposit(log: {
    transactionHash: string | null;
    logIndex: number | null;
    args: { player?: Address; amount?: bigint; nonce?: bigint };
  }): Promise<void> {
    const { transactionHash, logIndex, args } = log;
    if (!transactionHash || logIndex === null || !args.player || args.amount === undefined) {
      this.logger.warn('skipping malformed Deposit log');
      return;
    }

    const record = {
      txHash: transactionHash,
      logIndex,
      playerAddr: args.player,
      amount: args.amount,
      nonce: args.nonce ?? 0n,
    };
    const isNew = await this.store.recordDepositIfNew(record);
    if (!isNew) return; // already recorded (dedupe); reconcile handles retries

    await this.creditDeposit(record);
  }

  /**
   * Credit a recorded deposit to the ledger and mark it credited. Shared by the
   * live handler and the reconcile pass. The ledger credit is idempotent on the
   * `deposit:<tx>:<logIndex>` key, so calling this twice for one deposit is safe.
   */
  private async creditDeposit(record: {
    txHash: string;
    logIndex: number;
    playerAddr: string;
    amount: bigint;
  }): Promise<void> {
    // Convert on-chain wei to whole-CHIP ledger units (int64-safe). Sub-CHIP
    // dust is ignored on testnet (faucet mints whole CHIP).
    const { chip } = weiToChip(record.amount);

    const playerId = asPlayerId(record.playerAddr.toLowerCase());
    const credit = await this.wallet.win({
      playerId,
      amount: chip,
      idempotencyKey: `deposit:${record.txHash}:${record.logIndex}`,
      reference: 'onchain-deposit',
    });
    if (!credit.ok) {
      this.logger.error(`ledger credit failed for ${record.txHash}: ${credit.error.message}`);
      return; // leave credited=false; the reconcile pass retries
    }
    await this.store.markDepositCredited(record.txHash, record.logIndex);
    this.logger.log(`credited deposit ${chip} CHIP to ${playerId}`);

    await this.events.publish({
      name: 'onchain.deposit.confirmed',
      playerId,
      chip: chip.toString(),
      txHash: record.txHash,
    });
  }

  /**
   * Send an on-chain withdrawal (owner releases CHIP). `chipAmount` is in whole
   * CHIP (ledger units); it is converted to wei for the contract call.
   * Returns the tx hash.
   */
  async sendWithdrawal(
    playerAddr: Address,
    chipAmount: bigint,
    withdrawalId: `0x${string}`,
  ): Promise<string> {
    if (!this.walletClient) {
      throw new Error('Withdrawals unavailable: ONCHAIN_OWNER_KEY not set');
    }
    const weiAmount = chipToWei(chipAmount);
    await this.store.createWithdrawal(withdrawalId, playerAddr, chipAmount);
    try {
      const account = this.walletClient.account;
      if (!account) throw new Error('wallet client has no account');
      const hash = await this.walletClient.writeContract({
        account,
        chain: null,
        address: this.vault,
        abi: VAULT_ABI,
        functionName: 'withdraw',
        args: [playerAddr, weiAmount, withdrawalId],
      });
      await this.store.markWithdrawalSent(withdrawalId, hash);
      return hash;
    } catch (err) {
      await this.store.markWithdrawalFailed(withdrawalId);
      throw err;
    }
  }
}
