import { Body, Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { asPlayerId } from '@casino/contracts';
import {
  PROVABLY_FAIR_SERVICE,
  type IProvablyFairService,
} from '@/contracts/provably-fair.contract';
import { JwtAuthGuard, type AuthedRequest } from '@/modules/auth/jwt-auth.guard';
import { RotateSeedDto, VerifyDrawDto } from './dto/rotate-seed.dto';

/** Player-facing provably-fair endpoints. All require auth except verify. */
@ApiTags('provably-fair')
@Controller('provably-fair')
export class ProvablyFairController {
  constructor(@Inject(PROVABLY_FAIR_SERVICE) private readonly pf: IProvablyFairService) {}

  @Get('commitment')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async commitment(@Req() req: AuthedRequest) {
    return this.pf.getActiveCommitment(asPlayerId(req.player!.id));
  }

  @Post('rotate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async rotate(@Req() req: AuthedRequest, @Body() dto: RotateSeedDto) {
    return this.pf.rotate(asPlayerId(req.player!.id), dto.clientSeed);
  }

  @Post('reveal')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async reveal(@Req() req: AuthedRequest) {
    const result = await this.pf.reveal(asPlayerId(req.player!.id));
    if (!result.ok) throw result.error;
    return result.value;
  }

  /** Public: anyone can verify a revealed draw without auth. */
  @Post('verify')
  verify(@Body() dto: VerifyDrawDto) {
    const valid = this.pf.verify(
      {
        serverSeed: dto.serverSeed,
        serverSeedHash: dto.serverSeedHash,
        clientSeed: dto.clientSeed,
        nonce: dto.nonce,
      },
      dto.outcome,
    );
    return { valid };
  }
}
