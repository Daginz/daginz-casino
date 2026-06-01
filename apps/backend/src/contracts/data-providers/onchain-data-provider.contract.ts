/** Persistence port for on-chain listener state (cursor + dedupe + withdrawals). */
export const ONCHAIN_DATA_PROVIDER = Symbol('ONCHAIN_DATA_PROVIDER');

export interface DepositEventRecord {
  txHash: string;
  logIndex: number;
  playerAddr: string;
  amount: bigint;
  nonce: bigint;
}

export interface IOnchainDataProvider {
  /** Last block the listener has fully processed. */
  getCursor(): Promise<number>;
  setCursor(block: number): Promise<void>;

  /**
   * Record a deposit event if unseen. Returns true if it was newly inserted
   * (caller should credit), false if it was already recorded (dedupe).
   */
  recordDepositIfNew(ev: DepositEventRecord): Promise<boolean>;
  markDepositCredited(txHash: string, logIndex: number): Promise<void>;
  /**
   * Deposits recorded but not yet credited — a credit may have failed mid-flight
   * (wallet down) after the dedupe row was written. The reconcile pass retries
   * these so no deposit is silently lost.
   */
  listUncreditedDeposits(limit: number): Promise<DepositEventRecord[]>;

  /** Withdrawal bookkeeping for reconciliation. */
  createWithdrawal(id: string, playerAddr: string, amount: bigint): Promise<void>;
  markWithdrawalSent(id: string, txHash: string): Promise<void>;
  markWithdrawalFailed(id: string): Promise<void>;
}
