import { Module } from '@nestjs/common';
import { HealthModule } from '@/modules/health/health.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { WalletModule } from '@/modules/wallet/wallet.module';
import { ProvablyFairModule } from '@/modules/provably-fair/provably-fair.module';
import { GameModule } from '@/modules/game/game.module';

/**
 * Root assembly. As feature modules come online they register here.
 * (Block C: auth, wallet-port, provably-fair, game. Bonus/CRM/Risk/Reporting/
 *  onchain-listener added as they gain real logic.)
 */
@Module({
  imports: [HealthModule, AuthModule, WalletModule, ProvablyFairModule, GameModule],
})
export class AppModule {}
