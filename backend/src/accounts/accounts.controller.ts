import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccessJwtGuard } from '../auth/guards/access-jwt.guard';

@UseGuards(AccessJwtGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  list(@Req() req: any) {
    return this.accounts.list(req.user.sub);
  }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.accounts.get(req.user.sub, id);
  }

  @Post() 
  create(@Req() req: any, @Body() dto: CreateAccountDto) {
    return this.accounts.create(req.user.sub, dto);
  }

  @Patch(':id') 
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accounts.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.accounts.remove(req.user.sub, id);
  }
}
