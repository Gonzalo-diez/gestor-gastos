import { IsISO8601, IsOptional, IsString, IsNumber, Min, Max, IsUrl } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateTransactionDto {
  @IsOptional() @IsString() accountId?: string;
  @IsOptional() @IsString() categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0.01)
  @Max(1_000_000_000)
  amount?: number;

  @IsOptional() @IsISO8601() date?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  note?: string;

  @IsOptional() @IsUrl() receiptUrl?: string;
}