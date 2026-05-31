import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { WalletAddress } from '@casino/contracts';
import { AUTH_SERVICE, type IAuthService } from '@/contracts/auth.contract';
import { CreateChallengeDto, VerifySiweDto } from './dto/siwe.dto';

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
    return this.auth.verify({ message: dto.message, signature: dto.signature });
  }
}
