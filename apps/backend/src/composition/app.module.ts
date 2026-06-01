import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { env } from '@/config/env';
import { LoggingModule } from '@/shared/logging/logging.module';
import { EventsModule } from '@/shared/events/events.module';
import { DbModule } from '@/shared/db/db.module';
import { HealthModule } from '@/modules/health/health.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { WalletModule } from '@/modules/wallet/wallet.module';
import { ProvablyFairModule } from '@/modules/provably-fair/provably-fair.module';
import { GameModule } from '@/modules/game/game.module';
import { OnchainModule } from '@/modules/onchain/onchain.module';

/**
 * Root assembly. Feature modules register here as they come online.
 */
@Module({
  imports: [
    // Global rate limiting. Named default bucket; controllers/routes can apply
    // stricter @Throttle overrides (e.g. auth, /game/play).
    ThrottlerModule.forRoot([
      { name: 'default', ttl: env.THROTTLE_TTL_MS, limit: env.THROTTLE_LIMIT },
    ]),
    LoggingModule,
    EventsModule,
    DbModule,
    HealthModule,
    AuthModule,
    WalletModule,
    ProvablyFairModule,
    GameModule,
    OnchainModule,
  ],
  providers: [
    // Apply the throttler to every route by default.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
