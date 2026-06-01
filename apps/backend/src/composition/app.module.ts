import { Module } from '@nestjs/common';
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
    DbModule,
    HealthModule,
    AuthModule,
    WalletModule,
    ProvablyFairModule,
    GameModule,
    OnchainModule,
  ],
})
export class AppModule {}
