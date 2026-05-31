import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { PlayerId } from '@casino/contracts';
import { asPlayerId } from '@casino/contracts';
import { GAME_SERVICE, type IGameService } from '@/contracts/game.contract';
import { PlaceBetDto } from './dto/place-bet.dto';

@ApiTags('game')
@Controller('game')
export class GameController {
  constructor(@Inject(GAME_SERVICE) private readonly game: IGameService) {}

  @Post('bet')
  async bet(@Body() dto: PlaceBetDto) {
    // TODO(Block D): derive playerId from authenticated JWT, not a stub.
    const playerId: PlayerId = asPlayerId('stub-player');
    const result = await this.game.placeBet({
      playerId,
      game: dto.game,
      amount: BigInt(dto.amount),
      clientSeed: dto.clientSeed,
      params: dto.params,
    });
    if (!result.ok) throw result.error;
    // Serialize bigint for JSON transport.
    return { ...result.value, amount: result.value.amount.toString(), payout: result.value.payout.toString() };
  }
}
