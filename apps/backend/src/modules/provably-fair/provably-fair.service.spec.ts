import { createHash } from 'node:crypto';
import { ProvablyFairService } from './provably-fair.service';
import { deriveRoundSeed, roundOutcome } from './fair-math';
import type {
  ISeedDataProvider,
  SeedPair,
} from '@/contracts/data-providers/seed-data-provider.contract';
import { asPlayerId } from '@casino/contracts';

/**
 * In-memory fake of the seed port (fakes > mocks). One active seed per player,
 * drawNonce returns the pre-increment value just like the Postgres adapter.
 */
class FakeSeedStore implements ISeedDataProvider {
  private seeds = new Map<string, SeedPair>();
  private seq = 0;

  async findActive(playerId: string): Promise<SeedPair | null> {
    const s = this.seeds.get(playerId);
    return s && s.status === 'active' ? s : null;
  }

  async createActive(input: {
    playerId: string;
    serverSeed: string;
    serverSeedHash: string;
    clientSeed: string;
  }): Promise<SeedPair> {
    const pair: SeedPair = {
      id: `seed-${this.seq++}`,
      playerId: asPlayerId(input.playerId),
      serverSeed: input.serverSeed,
      serverSeedHash: input.serverSeedHash,
      clientSeed: input.clientSeed,
      nonce: 0,
      status: 'active',
    };
    this.seeds.set(input.playerId, pair);
    return pair;
  }

  async drawNonce(playerId: string): Promise<SeedPair | null> {
    const s = this.seeds.get(playerId);
    if (!s || s.status !== 'active') return null;
    const current = { ...s };
    s.nonce += 1; // post-increment in store; return pre-increment snapshot
    return current;
  }

  async revealActive(playerId: string): Promise<SeedPair | null> {
    const s = this.seeds.get(playerId);
    if (!s || s.status !== 'active') return null;
    s.status = 'revealed';
    return { ...s };
  }
}

describe('ProvablyFairService', () => {
  const player = asPlayerId('0xabc');

  function makeService() {
    return new ProvablyFairService(new FakeSeedStore());
  }

  it('creates an active commitment lazily, exposing only the hash', async () => {
    const svc = makeService();
    const c = await svc.getActiveCommitment(player);
    expect(c.serverSeedHash).toMatch(/^[0-9a-f]{64}$/);
    expect(c.nonce).toBe(0);
    // The commitment must NOT leak the server seed.
    expect(Object.values(c)).not.toContain(expect.stringMatching(/serverSeed/));
  });

  it('draw increments the nonce each call', async () => {
    const svc = makeService();
    const d0 = await svc.draw(player);
    const d1 = await svc.draw(player);
    expect(d0.ok && d1.ok).toBe(true);
    if (d0.ok && d1.ok) {
      expect(d0.value.nonce).toBe(0);
      expect(d1.value.nonce).toBe(1);
      expect(d0.value.outcome).not.toBe(d1.value.outcome);
    }
  });

  it('verify accepts a correctly revealed outcome', async () => {
    const svc = makeService();
    const draw = await svc.draw(player);
    expect(draw.ok).toBe(true);
    if (!draw.ok) return;

    const revealResult = await svc.reveal(player);
    expect(revealResult.ok).toBe(true);
    if (!revealResult.ok) return;
    const revealed = revealResult.value;

    // Recompute the outcome the player would verify.
    const outcome = roundOutcome(
      deriveRoundSeed(revealed.serverSeed, revealed.clientSeed, draw.value.nonce),
    );
    expect(svc.verify({ ...revealed, nonce: draw.value.nonce }, outcome)).toBe(true);
  });

  it('verify rejects a tampered outcome', async () => {
    const svc = makeService();
    await svc.draw(player);
    const revealResult = await svc.reveal(player);
    if (!revealResult.ok) throw new Error('reveal failed');
    const revealed = revealResult.value;
    expect(svc.verify(revealed, 0.123456789)).toBe(false);
  });

  it('verify rejects a server seed that does not match its hash', async () => {
    const svc = makeService();
    await svc.draw(player);
    const revealResult = await svc.reveal(player);
    if (!revealResult.ok) throw new Error('reveal failed');
    const revealed = revealResult.value;

    // Swap in a different server seed -> hash no longer matches.
    const forged = { ...revealed, serverSeed: 'forged-seed' };
    const fakeHash = createHash('sha256').update('forged-seed').digest('hex');
    expect(fakeHash).not.toBe(revealed.serverSeedHash);
    expect(svc.verify(forged, 0.5)).toBe(false);
  });
});
