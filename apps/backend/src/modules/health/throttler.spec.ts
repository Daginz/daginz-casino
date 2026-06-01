import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard, Throttle, SkipThrottle } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import type { AddressInfo } from 'node:net';

/**
 * Verifies the global rate limiter actually returns 429 past the limit, that a
 * per-route @Throttle override tightens it, and that @SkipThrottle exempts a
 * route. Boots a tiny app over a real ephemeral port and hits it with fetch —
 * no supertest dependency needed.
 */
@Controller()
class ProbeController {
  @Get('default')
  base(): string {
    return 'ok';
  }

  @Throttle({ default: { ttl: 60_000, limit: 2 } })
  @Get('strict')
  strict(): string {
    return 'ok';
  }

  @SkipThrottle()
  @Get('open')
  open(): string {
    return 'ok';
  }
}

async function hit(base: string, path: string): Promise<number> {
  const res = await fetch(`${base}${path}`);
  return res.status;
}

describe('Rate limiting (ThrottlerGuard)', () => {
  let app: INestApplication;
  let base: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 3 }])],
      controllers: [ProbeController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0); // ephemeral port
    const server = app.getHttpServer();
    const addr = server.address() as AddressInfo;
    base = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should 429 once the global limit (3) is exceeded', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 5; i += 1) statuses.push(await hit(base, '/default'));
    const ok = statuses.filter((s) => s === 200).length;
    const limited = statuses.filter((s) => s === 429).length;
    expect(ok).toBe(3);
    expect(limited).toBe(2);
  });

  it('should apply a stricter per-route limit (2) on @Throttle', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 4; i += 1) statuses.push(await hit(base, '/strict'));
    expect(statuses.filter((s) => s === 200).length).toBe(2);
    expect(statuses.filter((s) => s === 429).length).toBe(2);
  });

  it('should never rate-limit a @SkipThrottle route', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 10; i += 1) statuses.push(await hit(base, '/open'));
    expect(statuses.every((s) => s === 200)).toBe(true);
  });
});
