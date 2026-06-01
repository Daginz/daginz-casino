import { asPlayerId } from '@casino/contracts';
import { BonusService } from './bonus.service';
import type {
  IBonusDataProvider,
  BonusProfile,
  DailyClaimResult,
} from '@/contracts/data-providers/bonus-data-provider.contract';

const PLAYER = asPlayerId('0xabc');

function profile(over: Partial<BonusProfile> = {}): BonusProfile {
  return { playerId: PLAYER, freeSpins: 0, dailyLastClaimAt: null, dailyStreak: 0, ...over };
}

function makeService() {
  const bonuses = {
    getOrCreate: jest.fn(),
    addFreeSpins: jest.fn(),
    consumeFreeSpin: jest.fn(),
    claimDaily: jest.fn(),
  } as unknown as jest.Mocked<IBonusDataProvider>;
  return { service: new BonusService(bonuses), bonuses };
}

describe('BonusService.status', () => {
  it('reports claimable when never claimed', async () => {
    const { service, bonuses } = makeService();
    bonuses.getOrCreate.mockResolvedValue(profile({ freeSpins: 3 }));

    const s = await service.status(PLAYER);
    expect(s.freeSpins).toBe(3);
    expect(s.canClaimDaily).toBe(true);
    expect(s.nextDailyInMs).toBe(0);
  });

  it('reports NOT claimable within the cooldown window', async () => {
    const { service, bonuses } = makeService();
    // Claimed 1 minute ago — well within a 24h cooldown.
    bonuses.getOrCreate.mockResolvedValue(profile({ dailyLastClaimAt: new Date(Date.now() - 60_000) }));

    const s = await service.status(PLAYER);
    expect(s.canClaimDaily).toBe(false);
    expect(s.nextDailyInMs).toBeGreaterThan(0);
  });

  it('reports claimable again after the cooldown elapsed', async () => {
    const { service, bonuses } = makeService();
    // Claimed 25h ago — past a 24h cooldown.
    bonuses.getOrCreate.mockResolvedValue(profile({ dailyLastClaimAt: new Date(Date.now() - 25 * 60 * 60 * 1000) }));

    const s = await service.status(PLAYER);
    expect(s.canClaimDaily).toBe(true);
  });
});

describe('BonusService.claimDaily', () => {
  it('returns the updated status on a successful claim', async () => {
    const { service, bonuses } = makeService();
    const claimed: DailyClaimResult = {
      claimed: true,
      profile: profile({ freeSpins: 10, dailyStreak: 1, dailyLastClaimAt: new Date() }),
    };
    bonuses.claimDaily.mockResolvedValue(claimed);

    const result = await service.claimDaily(PLAYER);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.freeSpins).toBe(10);
      expect(result.value.dailyStreak).toBe(1);
      expect(result.value.canClaimDaily).toBe(false);
    }
  });

  it('errors (ConflictError) when still on cooldown', async () => {
    const { service, bonuses } = makeService();
    bonuses.claimDaily.mockResolvedValue({
      claimed: false,
      profile: profile({ dailyLastClaimAt: new Date(Date.now() - 60_000) }),
    });

    const result = await service.claimDaily(PLAYER);
    expect(result.ok).toBe(false);
  });
});

describe('BonusService.useFreeSpin', () => {
  it('delegates to the provider and returns its result', async () => {
    const { service, bonuses } = makeService();
    bonuses.consumeFreeSpin.mockResolvedValue(true);
    expect(await service.useFreeSpin(PLAYER)).toBe(true);

    bonuses.consumeFreeSpin.mockResolvedValue(false);
    expect(await service.useFreeSpin(PLAYER)).toBe(false);
  });
});
