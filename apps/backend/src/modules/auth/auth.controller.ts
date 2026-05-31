import { Body, Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { WalletAddress } from '@casino/contracts';
import { AUTH_SERVICE, type IAuthService } from '@/contracts/auth.contract';
import { CreateChallengeDto, VerifySiweDto } from './dto/siwe.dto';
import { JwtAuthGuard, type AuthedRequest } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AUTH_SERVICE) private readonly auth: IAuthService) {}

  @Post('challenge')
  async challenge(@Body() dto: CreateChallengeDto) {
    return this.auth.createChallenge(dto.address as WalletAddress);
  }

  @Post('verify')
  async verify(@Body() dto: VerifySiweDto) {
    const result = await this.auth.verify({ message: dto.message, signature: dto.signature });
    if (!result.ok) throw result.error;
    return result.value;
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: AuthedRequest) {
    return req.player;
  }
}
