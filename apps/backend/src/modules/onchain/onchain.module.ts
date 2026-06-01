import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ONCHAIN_DATA_PROVIDER } from '@/contracts/data-providers/onchain-data-provider.contract';
import { WalletModule } from '@/modules/wallet/wallet.module';
import { DbModule } from '@/shared/db/db.module';
import { env } from '@/config/env';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { OnchainListenerService } from './onchain-listener.service';
import { OnchainWithdrawService } from './onchain-withdraw.service';
import { OnchainController } from './onchain.controller';
import { PostgresOnchainDataProvider } from './providers/postgres-onchain.data-provider';

/**
 * On-chain listener module. The listener no-ops at runtime unless
 * ONCHAIN_ENABLED=true, so the app boots fine without a chain configured.
 * Withdraw endpoint debits the ledger then releases CHIP on-chain.
 */
@Module({
  imports: [
    DbModule,
    WalletModule,
    JwtModule.register({ secret: env.JWT_SECRET, signOptions: { expiresIn: '15m' } }),
  ],
  controllers: [OnchainController],
  providers: [
    OnchainListenerService,
    OnchainWithdrawService,
    { provide: ONCHAIN_DATA_PROVIDER, useClass: PostgresOnchainDataProvider },
    JwtAuthGuard,
  ],
  exports: [OnchainListenerService],
})
export class OnchainModule {}
