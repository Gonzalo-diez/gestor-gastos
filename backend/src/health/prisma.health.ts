import { Injectable } from '@nestjs/common';
import { HealthIndicatorService, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaIndicator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly his: HealthIndicatorService,
  ) {}

  async ping(key = 'database'): Promise<HealthIndicatorResult> {
    const ind = this.his.check(key);
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return ind.up();
    } catch (e: any) {
      return ind.down({ error: e?.message ?? 'query failed' });
    }
  }
}