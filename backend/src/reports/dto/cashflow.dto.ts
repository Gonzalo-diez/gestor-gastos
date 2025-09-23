import { IsISO8601, IsOptional, IsString, IsEnum, IsBooleanString } from 'class-validator';
import { Granularity } from './granularity.enum';

export class CashflowDto {
  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;

  @IsOptional() @IsString() accountId?: string;

  @IsEnum(Granularity) groupBy: Granularity = Granularity.MONTH;

  @IsOptional() @IsBooleanString()
  fillEmpty?: string;
}