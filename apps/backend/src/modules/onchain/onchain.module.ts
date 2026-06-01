import { Module } from '@nestjs/common';
import { ONCHAIN_DATA_PROVIDER } from '@/contracts/data-providers/onchain-data-provider.contract';
import { WalletModule } from '@/modules/wallet/wallet.module';
import { DbModule } from '@/shared/db/db.module';
import { OnchainListenerService } from './onchain-listener.service';
import { PostgresOnchainDataProvider } from './providers/postgres-onchain.data-provider';

/**
 * On-chain listener module. The service no-ops at runtime unless
 * ONCHAIN_ENABLED=true, so the app boots fine without a chain configured.
 */
@Module({
  imports: [DbModule, WalletModule],
  providers: [
    OnchainListenerService,
    { provide: ONCHAIN_DATA_PROVIDER, useClass: PostgresOnchainDataProvider },
  ],
  exports: [OnchainListenerService],
})
export class OnchainModule {}
