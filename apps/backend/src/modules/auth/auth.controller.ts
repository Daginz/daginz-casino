import { Body, Controller, Get, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { WalletAddress } from '@casino/contracts';
import { AUTH_SERVICE, type IAuthService, type AuthSession } from '@/contracts/auth.contract';
import { env } from '@/config/env';
import { CreateChallengeDto, VerifySiweDto } from './dto/siwe.dto';
import { JwtAuthGuard, type AuthedRequest } from './jwt-auth.guard';

const REFRESH_COOKIE = 'dgz_refresh';
const REFRESH_PATH = '/auth';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AUTH_SERVICE) private readonly auth: IAuthService) {}

  // Auth is brute-force sensitive — cap tighter than the global default
  // (env-tunable so the demo/e2e stack can relax it).
  @Throttle({ default: { ttl: env.THROTTLE_TTL_MS, limit: env.THROTTLE_AUTH_LIMIT } })
  @Post('challenge')
  async challenge(@Body() dto: CreateChallengeDto) {
    return this.auth.createChallenge(dto.address as WalletAddress);
  }

  @Throttle({ default: { ttl: env.THROTTLE_TTL_MS, limit: env.THROTTLE_AUTH_LIMIT } })
  @Post('verify')
  async verify(@Body() dto: VerifySiweDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.verify({ message: dto.message, signature: dto.signature });
    if (!result.ok) throw result.error;
    return this.respondWithSession(result.value, res);
  }

  /** Exchange the refresh cookie for a new access token (rotates the cookie). */
  @Throttle({ default: { ttl: env.THROTTLE_TTL_MS, limit: env.THROTTLE_AUTH_LIMIT } })
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = this.readRefreshCookie(req);
    const result = await this.auth.refresh(token ?? '');
    if (!result.ok) {
      this.clearRefreshCookie(res);
      throw result.error;
    }
    return this.respondWithSession(result.value, res);
  }

  /** Revoke the refresh token and clear the cookie. */
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(this.readRefreshCookie(req) ?? '');
    this.clearRefreshCookie(res);
    return { ok: true };
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: AuthedRequest) {
    return req.player;
  }

  /** Set the refresh cookie and return the public session (player + access). */
  private respondWithSession(session: AuthSession, res: Response) {
    res.cookie(REFRESH_COOKIE, session.refreshToken, {
      httpOnly: true,
      secure: env.AUTH_COOKIE_SECURE,
      sameSite: 'lax',
      path: REFRESH_PATH,
      expires: session.refreshExpiresAt,
    });
    // The refresh token never goes in the JSON body — cookie only.
    return { player: session.player, accessToken: session.accessToken };
  }

  private readRefreshCookie(req: Request): string | undefined {
    return (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
  }
}
