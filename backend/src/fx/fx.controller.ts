import { Controller, Get, Query } from '@nestjs/common';
import { FxService } from './fx.service';
@Controller('fx')
export class FxController {
  constructor(private fx: FxService) {}
  @Get() async get(@Query('base') base: string, @Query('quote') quote: string) {
    return { base, quote, rate: await this.fx.getRate(base, quote) };
  }
}