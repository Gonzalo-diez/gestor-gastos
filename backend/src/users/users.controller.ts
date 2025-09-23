import { Controller, Get, Patch, Body, UseGuards, Req, Post, Delete } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AccessJwtGuard } from '../auth/guards/access-jwt.guard';

@UseGuards(AccessJwtGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Get('me')
  me(@Req() req: Request & { user: { sub: string } }) {
    return this.users.me(req.user.sub);
  }

  @Patch('me')
  update(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.users.updateMe(req.user.sub, dto);
  }

  @Post('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(req.user.sub, dto.currentPassword, dto.newPassword);
  }

  @Delete('me')
  remove(@Req() req: any) {
    return this.users.deleteMe(req.user.sub);
  }
}
