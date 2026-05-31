import { Module } from '@nestjs/common';
import { WALLET_SERVICE } from '@/contracts/wallet.contract';
import { HttpWalletProvider } from './providers/http-wallet.provider';

/**
 * Wallet module exposes the WALLET_SERVICE port (backed by the Go service).
 * The HTTP adapter stays internal; only the token is exported.
 */
@Module({
  providers: [{ provide: WALLET_SERVICE, useClass: HttpWalletProvider }],
  exports: [WALLET_SERVICE],
})
export class WalletModule {}
