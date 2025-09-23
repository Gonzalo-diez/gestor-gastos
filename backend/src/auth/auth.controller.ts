import { Controller, Post, Get, UseGuards, Req, Res, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshJwtGuard } from "./guards/refresh-jwt.guard";
import { AccessJwtGuard } from "./guards/access-jwt.guard";
import type { Response } from "express";

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register') register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { access, refresh } = await this.auth.login(dto);
    res.cookie('refresh_token', refresh, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7*24*3600*1000 });
    return { access };
  }

  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const { sub, refreshToken } = req.user;
    const { access, refresh } = await this.auth.rotateRefresh(sub, refreshToken);
    res.cookie('refresh_token', refresh, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7*24*3600*1000 });
    return { access };
  }

  @UseGuards(AccessJwtGuard)
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.user.sub);
    res.clearCookie('refresh_token');
    return { ok: true };
  }

  @UseGuards(AccessJwtGuard)
  @Get('me') me(@Req() req: any) { return req.user; }
}
