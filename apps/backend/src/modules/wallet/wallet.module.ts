import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from '@/config/env';
import { WALLET_SERVICE } from '@/contracts/wallet.contract';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { HttpWalletProvider } from './providers/http-wallet.provider';
import { WalletController } from './wallet.controller';

/**
 * Wallet module exposes the WALLET_SERVICE port (backed by the Go service)
 * plus a thin read-only HTTP surface (GET /wallet/balance) for the frontend.
 * The HTTP adapter stays internal; only the token is exported.
 */
@Module({
  imports: [JwtModule.register({ secret: env.JWT_SECRET, signOptions: { expiresIn: '15m' } })],
  controllers: [WalletController],
  providers: [{ provide: WALLET_SERVICE, useClass: HttpWalletProvider }, JwtAuthGuard],
  exports: [WALLET_SERVICE],
})
export class WalletModule {}
