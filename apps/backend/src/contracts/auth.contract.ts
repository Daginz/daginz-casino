import type { PlayerId, WalletAddress } from '@casino/contracts';
import type { Result } from '@/shared/result';
import type { DomainError } from '@/shared/errors/domain-error';

/** DI token — inject across module boundaries via @Inject(AUTH_SERVICE). */
export const AUTH_SERVICE = Symbol('AUTH_SERVICE');

export interface Player {
  id: PlayerId;
  walletAddress: WalletAddress;
  createdAt: Date;
}

/** SIWE (Sign-In With Ethereum) nonce challenge. */
export interface SiweChallenge {
  nonce: string;
  issuedAt: Date;
}

export interface SiweVerification {
  message: string;
  signature: string;
}

export interface AuthSession {
  player: Player;
  /** Short-lived JWT for the Authorization header. */
  accessToken: string;
  /** Opaque long-lived token — set as an HTTP-only cookie, never in JS. */
  refreshToken: string;
  /** When the refresh token expires (for the cookie Max-Age). */
  refreshExpiresAt: Date;
}

export interface IAuthService {
  /** Issue a nonce for the wallet to sign (SIWE step 1). */
  createChallenge(address: WalletAddress): Promise<SiweChallenge>;
  /** Verify the signed SIWE message and start a session (SIWE step 2). */
  verify(input: SiweVerification): Promise<Result<AuthSession, DomainError>>;
  /**
   * Exchange a valid refresh token for a new session (rotates the refresh
   * token; the presented one is revoked). Detects reuse of a revoked token.
   */
  refresh(refreshToken: string): Promise<Result<AuthSession, DomainError>>;
  /** Revoke a refresh token (logout). Safe to call with an unknown token. */
  logout(refreshToken: string): Promise<void>;
  /** Resolve a player by id (used by other modules). */
  getPlayer(id: PlayerId): Promise<Result<Player, DomainError>>;
}
