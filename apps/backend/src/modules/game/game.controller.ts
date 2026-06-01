import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { asGameRoundId, asPlayerId } from '@casino/contracts';
import { env } from '@/config/env';
import { JwtAuthGuard, type AuthedRequest } from '@/modules/auth/jwt-auth.guard';
import { GameEngineService } from './engine/game-engine.service';
import { PlaceBetDto } from './dto/place-bet.dto';

function serializeRound(r: {
  id: string;
  game: string;
  stake: bigint;
  payout: bigint;
  outcome: number;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  detail: unknown;
  createdAt: Date;
}) {
  return { ...r, stake: r.stake.toString(), payout: r.payout.toString() };
}

@ApiTags('game')
@Controller('game')
export class GameController {
  constructor(private readonly engine: GameEngineService) {}

  @Get('list')
  list() {
    return this.engine.listGames();
  }

  // Cap spin rate per client — a human can't sanely spin faster, and it caps
  // abuse / accidental loops. Env-tunable (per 10s window).
  @Throttle({ default: { ttl: 10_000, limit: env.THROTTLE_PLAY_LIMIT } })
  @Post('play')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async play(@Req() req: AuthedRequest, @Body() dto: PlaceBetDto) {
    const result = await this.engine.play({
      playerId: asPlayerId(req.player!.id),
      gameId: dto.gameId,
      stake: BigInt(dto.stake),
      params: dto.params,
      useFreeSpin: dto.useFreeSpin,
    });
    if (!result.ok) throw result.error;
    return serializeRound(result.value);
  }

  @Get('rounds/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async round(@Param('id') id: string) {
    const r = await this.engine.getRound(asGameRoundId(id));
    if (!r.ok) throw r.error;
    return serializeRound(r.value);
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async history(@Req() req: AuthedRequest) {
    const rounds = await this.engine.history(asPlayerId(req.player!.id), 20);
    return rounds.map(serializeRound);
  }
}
