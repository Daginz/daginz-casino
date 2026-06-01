import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from '@/config/env';
import { BONUS_SERVICE } from '@/contracts/bonus.contract';
import { BONUS_DATA_PROVIDER } from '@/contracts/data-providers/bonus-data-provider.contract';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { DbModule } from '@/shared/db/db.module';
import { BonusService } from './bonus.service';
import { BonusController } from './bonus.controller';
import { PostgresBonusDataProvider } from './providers/postgres-bonus.data-provider';

/**
 * Bonus economy module: free spins + daily rewards. Exports BONUS_SERVICE so
 * the game module can grant free spins (scatter trigger) and spend them as a
 * bet source — without coupling to the ledger.
 */
@Module({
  imports: [
    DbModule,
    JwtModule.register({ secret: env.JWT_SECRET, signOptions: { expiresIn: '15m' } }),
  ],
  controllers: [BonusController],
  providers: [
    { provide: BONUS_SERVICE, useClass: BonusService },
    { provide: BONUS_DATA_PROVIDER, useClass: PostgresBonusDataProvider },
    JwtAuthGuard,
  ],
  exports: [BONUS_SERVICE],
})
export class BonusModule {}
