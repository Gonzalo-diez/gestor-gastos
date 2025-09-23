import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('currencies')
export class CurrenciesController {
  constructor(private prisma: PrismaService) {}
  @Get()
  list() {
    return this.prisma.currency.findMany({
      orderBy: { code: 'asc' },
      select: { code: true, name: true, symbol: true, decimals: true },
    });
  }
}