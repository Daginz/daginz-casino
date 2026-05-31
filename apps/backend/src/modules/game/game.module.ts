import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GAME_SERVICE } from '@/contracts/game.contract';
import { env } from '@/config/env';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { ProvablyFairModule } from '@/modules/provably-fair/provably-fair.module';
import { WalletModule } from '@/modules/wallet/wallet.module';
import { GameService } from './game.service';
import { GameController } from './game.controller';

/**
 * Game depends on PROVABLY_FAIR and WALLET tokens (contracts-first).
 * JwtModule registered so the bet endpoint can derive the player from the JWT.
 */
@Module({
  imports: [
    ProvablyFairModule,
    WalletModule,
    JwtModule.register({ secret: env.JWT_SECRET, signOptions: { expiresIn: '15m' } }),
  ],
  controllers: [GameController],
  providers: [{ provide: GAME_SERVICE, useClass: GameService }, JwtAuthGuard],
  exports: [GAME_SERVICE],
})
export class GameModule {}
