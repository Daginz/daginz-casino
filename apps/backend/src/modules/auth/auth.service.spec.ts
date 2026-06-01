import { JwtService } from '@nestjs/jwt';
import { asPlayerId, asWalletAddress } from '@casino/contracts';
import type { Player } from '@/contracts/auth.contract';
import type { IPlayerDataProvider } from '@/contracts/data-providers/player-data-provider.contract';
import type {
  IRefreshTokenDataProvider,
  StoredRefreshToken,
} from '@/contracts/data-providers/refresh-token-data-provider.contract';
import { AuthService } from './auth.service';
import { NonceStore } from './nonce.store';

// Mock siwe so we control what verify() resolves to (no real crypto needed).
const mockVerify = jest.fn();
jest.mock('siwe', () => ({
  SiweMessage: jest.fn().mockImplementation(() => ({ verify: mockVerify })),
}));

const ADDR = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const player: Player = {
  id: asPlayerId(ADDR.toLowerCase()),
  walletAddress: asWalletAddress(ADDR.toLowerCase()),
  createdAt: new Date(0),
};

function makeService() {
  const players = {
    upsertByAddress: jest.fn().mockResolvedValue(player),
    findById: jest.fn().mockResolvedValue(player),
  } as unknown as jest.Mocked<IPlayerDataProvider>;

  const refreshTokens = {
    create: jest.fn().mockResolvedValue(undefined),
    findActiveByHash: jest.fn(),
    findByHash: jest.fn(),
    revokeByHash: jest.fn().mockResolvedValue(undefined),
    revokeAllForPlayer: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<IRefreshTokenDataProvider>;

  const nonces = new NonceStore();
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') } as unknown as JwtService;

  const service = new AuthService(players, refreshTokens, nonces, jwt);
  return { service, players, refreshTokens, nonces, jwt };
}

beforeEach(() => {
  mockVerify.mockReset();
});

describe('AuthService.verify', () => {
  it('issues a session and stores a refresh token on a valid signature', async () => {
    const { service, nonces, refreshTokens } = makeService();
    const { nonce } = nonces.issue();
    mockVerify.mockResolvedValue({ data: { nonce, address: ADDR } });

    const result = await service.verify({ message: 'msg', signature: 'sig' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accessToken).toBe('signed.jwt.token');
      expect(result.value.refreshToken).toHaveLength(64); // 32 random bytes hex
      expect(refreshTokens.create).toHaveBeenCalledTimes(1);
      // The stored value is a hash, never the raw token.
      const stored = refreshTokens.create.mock.calls[0]?.[0];
      expect(stored?.tokenHash).toBeDefined();
      expect(stored?.tokenHash).not.toBe(result.value.refreshToken);
    }
  });

  it('rejects an invalid signature', async () => {
    const { service } = makeService();
    mockVerify.mockRejectedValue(new Error('bad sig'));

    const result = await service.verify({ message: 'm', signature: 's' });
    expect(result.ok).toBe(false);
  });

  it('rejects a replayed nonce (second verify with same nonce fails)', async () => {
    const { service, nonces } = makeService();
    const { nonce } = nonces.issue();
    mockVerify.mockResolvedValue({ data: { nonce, address: ADDR } });

    const first = await service.verify({ message: 'm', signature: 's' });
    expect(first.ok).toBe(true);

    const second = await service.verify({ message: 'm', signature: 's' });
    expect(second.ok).toBe(false); // nonce already consumed
  });
});

describe('AuthService.refresh', () => {
  const active: StoredRefreshToken = {
    id: 'rt1',
    playerId: player.id,
    expiresAt: new Date(Date.now() + 1_000_000),
    revokedAt: null,
  };

  it('rotates: revokes the presented token and issues a new session', async () => {
    const { service, refreshTokens } = makeService();
    refreshTokens.findActiveByHash.mockResolvedValue(active);

    const result = await service.refresh('some-refresh-token');

    expect(result.ok).toBe(true);
    expect(refreshTokens.revokeByHash).toHaveBeenCalledTimes(1); // old one revoked
    expect(refreshTokens.create).toHaveBeenCalledTimes(1); // new one stored
  });

  it('detects reuse of a revoked token and revokes the whole family', async () => {
    const { service, refreshTokens } = makeService();
    refreshTokens.findActiveByHash.mockResolvedValue(null); // not active
    refreshTokens.findByHash.mockResolvedValue({ ...active, revokedAt: new Date() }); // but exists, revoked

    const result = await service.refresh('stolen-token');

    expect(result.ok).toBe(false);
    expect(refreshTokens.revokeAllForPlayer).toHaveBeenCalledWith(player.id);
  });

  it('rejects an entirely unknown token', async () => {
    const { service, refreshTokens } = makeService();
    refreshTokens.findActiveByHash.mockResolvedValue(null);
    refreshTokens.findByHash.mockResolvedValue(null);

    const result = await service.refresh('nope');
    expect(result.ok).toBe(false);
    expect(refreshTokens.revokeAllForPlayer).not.toHaveBeenCalled();
  });
});

describe('AuthService.logout', () => {
  it('revokes the presented refresh token', async () => {
    const { service, refreshTokens } = makeService();
    await service.logout('a-token');
    expect(refreshTokens.revokeByHash).toHaveBeenCalledTimes(1);
  });

  it('is a no-op for an empty token', async () => {
    const { service, refreshTokens } = makeService();
    await service.logout('');
    expect(refreshTokens.revokeByHash).not.toHaveBeenCalled();
  });
});
