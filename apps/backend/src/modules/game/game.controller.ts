import { Body, Controller, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { asPlayerId } from '@casino/contracts';
import { GAME_SERVICE, type IGameService } from '@/contracts/game.contract';
import { JwtAuthGuard, type AuthedRequest } from '@/modules/auth/jwt-auth.guard';
import { PlaceBetDto } from './dto/place-bet.dto';

@ApiTags('game')
@Controller('game')
export class GameController {
  constructor(@Inject(GAME_SERVICE) private readonly game: IGameService) {}

  @Post('bet')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async bet(@Req() req: AuthedRequest, @Body() dto: PlaceBetDto) {
    const result = await this.game.placeBet({
      playerId: asPlayerId(req.player!.id),
      game: dto.game,
      amount: BigInt(dto.amount),
      clientSeed: dto.clientSeed,
      params: dto.params,
    });
    if (!result.ok) throw result.error;
    return {
      ...result.value,
      amount: result.value.amount.toString(),
      payout: result.value.payout.toString(),
    };
  }
}
