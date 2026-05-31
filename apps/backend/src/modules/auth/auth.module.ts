import { Module } from '@nestjs/common';
import { AUTH_SERVICE } from '@/contracts/auth.contract';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  controllers: [AuthController],
  providers: [{ provide: AUTH_SERVICE, useClass: AuthService }],
  exports: [AUTH_SERVICE],
})
export class AuthModule {}
