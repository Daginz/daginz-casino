import { Module } from '@nestjs/common';
import { GAME_SERVICE } from '@/contracts/game.contract';
import { ProvablyFairModule } from '@/modules/provably-fair/provably-fair.module';
import { WalletModule } from '@/modules/wallet/wallet.module';
import { GameService } from './game.service';
import { GameController } from './game.controller';

/**
 * Game depends on the PROVABLY_FAIR and WALLET tokens, imported via their
 * modules (contracts-first — no direct cross-module class imports).
 */
@Module({
  imports: [ProvablyFairModule, WalletModule],
  controllers: [GameController],
  providers: [{ provide: GAME_SERVICE, useClass: GameService }],
  exports: [GAME_SERVICE],
})
export class GameModule {}
