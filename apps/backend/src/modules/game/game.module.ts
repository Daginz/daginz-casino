import { Module, type OnModuleInit, Inject } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from '@/config/env';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { ProvablyFairModule } from '@/modules/provably-fair/provably-fair.module';
import { WalletModule } from '@/modules/wallet/wallet.module';
import { BonusModule } from '@/modules/bonus/bonus.module';
import { DbModule } from '@/shared/db/db.module';
import { GAME_ROUND_DATA_PROVIDER } from '@/contracts/data-providers/game-round-data-provider.contract';
import { GAME_REGISTRY, GameRegistry } from './engine/game-registry';
import { GameEngineService } from './engine/game-engine.service';
import { PostgresGameRoundDataProvider } from './providers/postgres-game-round.data-provider';
import { SlotGame } from './games/slot/slot.game';
import { GameController } from './game.controller';

/**
 * Game module: generic engine + registry + round storage, plus all registered
 * games. To add a game: provide its GameDefinition and register it in onInit.
 */
@Module({
  imports: [
    DbModule,
    ProvablyFairModule,
    WalletModule,
    BonusModule,
    JwtModule.register({ secret: env.JWT_SECRET, signOptions: { expiresIn: '15m' } }),
  ],
  controllers: [GameController],
  providers: [
    GameEngineService,
    { provide: GAME_REGISTRY, useClass: GameRegistry },
    { provide: GAME_ROUND_DATA_PROVIDER, useClass: PostgresGameRoundDataProvider },
    SlotGame,
    JwtAuthGuard,
  ],
  exports: [GameEngineService],
})
export class GameModule implements OnModuleInit {
  constructor(
    @Inject(GAME_REGISTRY) private readonly registry: GameRegistry,
    private readonly slot: SlotGame,
  ) {}

  onModuleInit(): void {
    // Register every game here — the only place a new game is wired in.
    this.registry.register(this.slot);
  }
}
