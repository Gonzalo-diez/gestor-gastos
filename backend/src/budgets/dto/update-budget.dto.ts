import { IsOptional, IsString, Matches, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

const PERIOD_RX = /^(\d{4}-(0[1-9]|1[0-2])|MONTHLY)$/;

export class UpdateBudgetDto {
  @IsOptional() @IsString() categoryId?: string;

  @IsOptional()
  @IsString()
  @Matches(PERIOD_RX, { message: 'period debe ser YYYY-MM o MONTHLY' })
  period?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.01)
  amount?: number;
}