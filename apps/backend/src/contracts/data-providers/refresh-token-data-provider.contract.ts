import type { PlayerId } from '@casino/contracts';

/** Repository port for refresh-token persistence (Postgres-backed). */
export const REFRESH_TOKEN_DATA_PROVIDER = Symbol('REFRESH_TOKEN_DATA_PROVIDER');

export interface StoredRefreshToken {
  id: string;
  playerId: PlayerId;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface IRefreshTokenDataProvider {
  /** Persist a new refresh token (hash only) for a player. */
  create(input: { playerId: PlayerId; tokenHash: string; expiresAt: Date }): Promise<void>;
  /** Look up an active (non-revoked, non-expired) token by its hash. */
  findActiveByHash(tokenHash: string): Promise<StoredRefreshToken | null>;
  /** Look up ANY token by hash (incl. revoked) — used for reuse detection. */
  findByHash(tokenHash: string): Promise<StoredRefreshToken | null>;
  /** Revoke a single token by hash (rotation / logout). */
  revokeByHash(tokenHash: string): Promise<void>;
  /** Revoke every token for a player (logout-all / theft response). */
  revokeAllForPlayer(playerId: PlayerId): Promise<void>;
}
