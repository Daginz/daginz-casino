import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { asPlayerId } from '@casino/contracts';
import { WALLET_SERVICE, type IWalletService } from '@/contracts/wallet.contract';
import { JwtAuthGuard, type AuthedRequest } from '@/modules/auth/jwt-auth.guard';

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(@Inject(WALLET_SERVICE) private readonly wallet: IWalletService) {}

  /** The player's off-chain ledger (casino) balance in CHIP minor units. */
  @Get('balance')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async balance(@Req() req: AuthedRequest) {
    const result = await this.wallet.getBalance(asPlayerId(req.player!.id));
    if (!result.ok) throw result.error;
    return { playerId: result.value.playerId, amount: result.value.amount.toString() };
  }
}
