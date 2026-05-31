import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { PlayerId, WalletAddress } from '@casino/contracts';
import { asPlayerId } from '@casino/contracts';
import type {
  AuthSession,
  IAuthService,
  Player,
  SiweChallenge,
  SiweVerification,
} from '@/contracts/auth.contract';
import { err, ok, type Result } from '@/shared/result';
import { DomainError, EntityNotFoundError } from '@/shared/errors/domain-error';

/**
 * SIWE auth — STUB (Block C). Real signature verification, nonce storage and
 * JWT issuance arrive in Block D. Shapes match the contract so endpoints wire.
 */
@Injectable()
export class AuthService implements IAuthService {
  async createChallenge(_address: WalletAddress): Promise<SiweChallenge> {
    return { nonce: randomBytes(16).toString('hex'), issuedAt: new Date() };
  }

  async verify(_input: SiweVerification): Promise<Result<AuthSession, DomainError>> {
    // TODO(Block D): verify signature against nonce, upsert player, sign JWT.
    const player: Player = {
      id: asPlayerId('stub-player'),
      walletAddress: '0x0000000000000000000000000000000000000000' as WalletAddress,
      createdAt: new Date(),
    };
    return ok({ player, accessToken: 'stub-jwt' });
  }

  async getPlayer(id: PlayerId): Promise<Result<Player, DomainError>> {
    // TODO(Block D): load from Postgres.
    return err(new EntityNotFoundError(`Player ${id} not found (stub)`));
  }
}
