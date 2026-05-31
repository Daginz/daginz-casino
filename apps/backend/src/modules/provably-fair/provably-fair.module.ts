import { Module } from '@nestjs/common';
import { PROVABLY_FAIR_SERVICE } from '@/contracts/provably-fair.contract';
import { ProvablyFairService } from './provably-fair.service';

@Module({
  providers: [{ provide: PROVABLY_FAIR_SERVICE, useClass: ProvablyFairService }],
  exports: [PROVABLY_FAIR_SERVICE],
})
export class ProvablyFairModule {}
