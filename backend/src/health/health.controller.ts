import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { PrismaIndicator } from './prisma.health';

@Controller()
export class HealthController {
  constructor(private hc: HealthCheckService, private db: PrismaIndicator) {}

  @Get('health')
  @HealthCheck()
  check() {
    return this.hc.check([() => this.db.ping()]);
  }
}