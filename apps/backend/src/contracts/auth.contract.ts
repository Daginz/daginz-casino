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
  accessToken: string;
}

export interface IAuthService {
  /** Issue a nonce for the wallet to sign (SIWE step 1). */
  createChallenge(address: WalletAddress): Promise<SiweChallenge>;
  /** Verify the signed SIWE message and start a session (SIWE step 2). */
  verify(input: SiweVerification): Promise<Result<AuthSession, DomainError>>;
  /** Resolve a player by id (used by other modules). */
  getPlayer(id: PlayerId): Promise<Result<Player, DomainError>>;
}
