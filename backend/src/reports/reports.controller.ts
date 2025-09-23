import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { SummaryDto } from './dto/summary.dto';
import { CashflowDto } from './dto/cashflow.dto';
import { TopCategoriesDto } from './dto/top-categories.dto';
import { AccessJwtGuard } from '../auth/guards/access-jwt.guard';

@UseGuards(AccessJwtGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('summary')
  summary(@Req() req: any, @Query() q: SummaryDto) {
    return this.reports.summary(req.user.sub, q);
  }

  @Get('cashflow')
  cashflow(@Req() req: any, @Query() q: CashflowDto) {
    return this.reports.cashflow(req.user.sub, q);
  }

  @Get('top-categories')
  top(@Req() req: any, @Query() q: TopCategoriesDto) {
    return this.reports.topCategories(req.user.sub, q);
  }
}