import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { UpsertBudgetDto } from './dto/upsert-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { QueryBudgetsDto } from './dto/query-budgets.dto';
import { AccessJwtGuard } from '../auth/guards/access-jwt.guard';

@UseGuards(AccessJwtGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  @Get()
  list(@Req() req: any, @Query() q: QueryBudgetsDto) {
    return this.budgets.list(req.user.sub, q);
  }

  @Post()
  upsert(@Req() req: any, @Body() dto: UpsertBudgetDto) {
    return this.budgets.create(req.user.sub, dto);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.budgets.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.budgets.remove(req.user.sub, id);
  }
}