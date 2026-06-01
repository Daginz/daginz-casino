import { Body, Controller, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { asPlayerId } from '@casino/contracts';
import type { WalletAddress } from '@casino/contracts';
import { JwtAuthGuard, type AuthedRequest } from '@/modules/auth/jwt-auth.guard';
import { WithdrawDto } from './dto/withdraw.dto';
import { OnchainWithdrawService } from './onchain-withdraw.service';

@ApiTags('onchain')
@Controller('onchain')
export class OnchainController {
  constructor(private readonly withdrawSvc: OnchainWithdrawService) {}

  /** Withdraw CHIP from the ledger back on-chain to the player's wallet. */
  @Post('withdraw')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async withdraw(@Req() req: AuthedRequest, @Body() dto: WithdrawDto) {
    const player = req.player!;
    const result = await this.withdrawSvc.withdraw(
      asPlayerId(player.id),
      player.address as WalletAddress,
      BigInt(dto.amount),
    );
    if (!result.ok) throw result.error;
    return result.value;
  }
}
