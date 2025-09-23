import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const hash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({ data: { email: dto.email, password: hash, name: dto.name } });
    return this.issueTokens(user.id, user.email);
  }

  async validate(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(pass, user.password))) return null;
    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validate(dto.email, dto.password);
    if (!user) throw new UnauthorizedException();
    return this.issueTokens(user.id, user.email);
  }

  async issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const access = await this.jwt.signAsync(payload, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_TTL || '15m' });
    const refresh = await this.jwt.signAsync(payload, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: process.env.JWT_REFRESH_TTL || '7d' });
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: await bcrypt.hash(refresh, 12) },
    });
    return { access, refresh };
  }

  async rotateRefresh(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.refreshTokenHash || !(await bcrypt.compare(refreshToken, user.refreshTokenHash))) {
      throw new UnauthorizedException();
    }
    return this.issueTokens(user.id, user.email);
  }

  async logout(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
  }
}