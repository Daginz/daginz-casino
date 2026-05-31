import type { Player } from '@/contracts/auth.contract';
import type { WalletAddress } from '@casino/contracts';

/** Repository port for player persistence. Implemented by a Postgres provider. */
export const PLAYER_DATA_PROVIDER = Symbol('PLAYER_DATA_PROVIDER');

export interface IPlayerDataProvider {
  /** Find-or-create a player by wallet address (addresses are stored lowercased). */
  upsertByAddress(address: WalletAddress): Promise<Player>;
  findById(id: string): Promise<Player | null>;
}
