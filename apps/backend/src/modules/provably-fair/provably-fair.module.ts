import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PROVABLY_FAIR_SERVICE } from '@/contracts/provably-fair.contract';
import { SEED_DATA_PROVIDER } from '@/contracts/data-providers/seed-data-provider.contract';
import { env } from '@/config/env';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { ProvablyFairService } from './provably-fair.service';
import { PostgresSeedDataProvider } from './providers/postgres-seed.data-provider';
import { ProvablyFairController } from './provably-fair.controller';

@Module({
  imports: [JwtModule.register({ secret: env.JWT_SECRET, signOptions: { expiresIn: '15m' } })],
  controllers: [ProvablyFairController],
  providers: [
    { provide: PROVABLY_FAIR_SERVICE, useClass: ProvablyFairService },
    { provide: SEED_DATA_PROVIDER, useClass: PostgresSeedDataProvider },
    JwtAuthGuard,
  ],
  exports: [PROVABLY_FAIR_SERVICE],
})
export class ProvablyFairModule {}
