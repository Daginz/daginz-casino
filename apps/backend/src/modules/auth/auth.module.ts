import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AUTH_SERVICE } from '@/contracts/auth.contract';
import { PLAYER_DATA_PROVIDER } from '@/contracts/data-providers/player-data-provider.contract';
import { REFRESH_TOKEN_DATA_PROVIDER } from '@/contracts/data-providers/refresh-token-data-provider.contract';
import { env } from '@/config/env';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { NonceStore } from './nonce.store';
import { PostgresPlayerDataProvider } from './providers/postgres-player.data-provider';
import { PostgresRefreshTokenDataProvider } from './providers/postgres-refresh-token.data-provider';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: AUTH_SERVICE, useClass: AuthService },
    { provide: PLAYER_DATA_PROVIDER, useClass: PostgresPlayerDataProvider },
    { provide: REFRESH_TOKEN_DATA_PROVIDER, useClass: PostgresRefreshTokenDataProvider },
    NonceStore,
    JwtAuthGuard,
  ],
  exports: [AUTH_SERVICE, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
