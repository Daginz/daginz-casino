import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
import { err, ok, type Result } from '@/shared/result';
import {
  DomainError,
  EntityNotFoundError,
  UnauthorizedError,
} from '@/shared/errors/domain-error';
import { NonceStore } from './nonce.store';

interface JwtPayload {
  sub: string;
  address: string;
}

/**
 * SIWE (EIP-4361) authentication. Verifies the signed message against an
 * issued nonce, upserts the player, and signs a JWT. Real crypto — no stubs.
 */
@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(PLAYER_DATA_PROVIDER) private readonly players: IPlayerDataProvider,
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
    const accessToken = await this.signToken(player);
    return ok({ player, accessToken });
  }

  async getPlayer(id: PlayerId): Promise<Result<Player, DomainError>> {
    const player = await this.players.findById(id);
    if (!player) return err(new EntityNotFoundError(`Player ${id} not found`));
    return ok(player);
  }

  private async signToken(player: Player): Promise<string> {
    // The ledger player id IS the lowercased wallet address — single identity
    // source across auth, game (debit) and the on-chain listener (credit).
    // The DB UUID (player.id) stays the players-table PK, but is NOT the ledger
    // key. Using the address everywhere keeps deposits/bets/withdrawals aligned.
    const payload: JwtPayload = {
      sub: player.walletAddress.toLowerCase(),
      address: player.walletAddress,
    };
    return this.jwt.signAsync(payload);
  }
}
