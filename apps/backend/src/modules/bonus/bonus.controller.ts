import { Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { asPlayerId } from '@casino/contracts';
import { BONUS_SERVICE, type IBonusService } from '@/contracts/bonus.contract';
import { JwtAuthGuard, type AuthedRequest } from '@/modules/auth/jwt-auth.guard';

@ApiTags('bonus')
@Controller('bonus')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BonusController {
  constructor(@Inject(BONUS_SERVICE) private readonly bonus: IBonusService) {}

  /** Current bonus status: free spins + whether the daily can be claimed. */
  @Get()
  async status(@Req() req: AuthedRequest) {
    return this.bonus.status(asPlayerId(req.player!.id));
  }

  /** Claim the daily reward (free spins). 409 if still on cooldown. */
  @Post('daily/claim')
  async claimDaily(@Req() req: AuthedRequest) {
    const result = await this.bonus.claimDaily(asPlayerId(req.player!.id));
    if (!result.ok) throw result.error;
    return result.value;
  }
}
