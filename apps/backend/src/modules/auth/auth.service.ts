import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { SiweMessage } from 'siwe';
import type { PlayerId, WalletAddress } from '@casino/contracts';
import { asWalletAddress } from '@casino/contracts';
import type {
  AuthSession,
  IAuthService,
  Player,
  SiweChallenge,
  SiweVerification,
} from '@/contracts/auth.contract';
import {
  PLAYER_DATA_PROVIDER,
  type IPlayerDataProvider,
} from '@/contracts/data-providers/player-data-provider.contract';
import {
  REFRESH_TOKEN_DATA_PROVIDER,
  type IRefreshTokenDataProvider,
} from '@/contracts/data-providers/refresh-token-data-provider.contract';
import { err, ok, type Result } from '@/shared/result';
import {
  DomainError,
  EntityNotFoundError,
  UnauthorizedError,
} from '@/shared/errors/domain-error';
import { env } from '@/config/env';
import { NonceStore } from './nonce.store';

interface JwtPayload {
  sub: string;
  address: string;
}

/**
 * SIWE (EIP-4361) authentication with refresh-token rotation.
 *
 * Access tokens are short-lived JWTs (15m). Refresh tokens are opaque random
 * strings, stored only as a SHA-256 hash, rotated on every use, and revoked on
 * logout. Presenting an already-revoked refresh token is treated as theft and
 * revokes the player's whole token family.
 */
@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(PLAYER_DATA_PROVIDER) private readonly players: IPlayerDataProvider,
    @Inject(REFRESH_TOKEN_DATA_PROVIDER) private readonly refreshTokens: IRefreshTokenDataProvider,
    private readonly nonces: NonceStore,
    private readonly jwt: JwtService,
  ) {}

  async createChallenge(_address: WalletAddress): Promise<SiweChallenge> {
    const { nonce, issuedAt } = this.nonces.issue();
    return { nonce, issuedAt };
  }

  async verify(input: SiweVerification): Promise<Result<AuthSession, DomainError>> {
    let fields;
    try {
      const message = new SiweMessage(input.message);
      fields = await message.verify({ signature: input.signature });
    } catch {
      return err(new UnauthorizedError('Invalid SIWE signature'));
    }

    const { nonce, address } = fields.data;
    if (!this.nonces.consume(nonce)) {
      return err(new UnauthorizedError('Invalid or expired nonce'));
    }

    const player = await this.players.upsertByAddress(asWalletAddress(address.toLowerCase()));
    return ok(await this.issueSession(player));
  }

  async refresh(refreshToken: string): Promise<Result<AuthSession, DomainError>> {
    const hash = this.hashToken(refreshToken);
    const active = await this.refreshTokens.findActiveByHash(hash);

    if (!active) {
      // Not active: maybe it was already rotated (reuse) or never existed.
      const any = await this.refreshTokens.findByHash(hash);
      if (any) {
        // Reuse of a revoked/expired token → treat as compromise, nuke family.
        await this.refreshTokens.revokeAllForPlayer(any.playerId);
      }
      return err(new UnauthorizedError('Invalid or expired refresh token'));
    }

    const player = await this.players.findById(active.playerId);
    if (!player) return err(new UnauthorizedError('Player no longer exists'));

    // Rotate: revoke the presented token, issue a fresh session.
    await this.refreshTokens.revokeByHash(hash);
    return ok(await this.issueSession(player));
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    await this.refreshTokens.revokeByHash(this.hashToken(refreshToken));
  }

  async getPlayer(id: PlayerId): Promise<Result<Player, DomainError>> {
    const player = await this.players.findById(id);
    if (!player) return err(new EntityNotFoundError(`Player ${id} not found`));
    return ok(player);
  }

  /** Mint an access JWT + a fresh (stored, hashed) refresh token for a player. */
  private async issueSession(player: Player): Promise<AuthSession> {
    const accessToken = await this.signToken(player);
    const refreshToken = randomBytes(32).toString('hex');
    const refreshExpiresAt = new Date(Date.now() + env.REFRESH_TTL_MS);
    await this.refreshTokens.create({
      playerId: player.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: refreshExpiresAt,
    });
    return { player, accessToken, refreshToken, refreshExpiresAt };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async signToken(player: Player): Promise<string> {
    // The ledger player id IS the lowercased wallet address — single identity
    // source across auth, game (debit) and the on-chain listener (credit).
    const payload: JwtPayload = {
      sub: player.walletAddress.toLowerCase(),
      address: player.walletAddress,
    };
    return this.jwt.signAsync(payload);
  }
}
