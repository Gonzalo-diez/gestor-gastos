import { IsISO8601, IsOptional, IsString, IsNumber, Min, Max, IsUrl } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateTransactionDto {
  @IsString() accountId: string;
  @IsString() categoryId: string;

  // Prisma.Decimal: envía número positivo (2 decimales máx recomendado)
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0.01)
  @Max(1_000_000_000)
  amount: number;

  @IsISO8601() date: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  note?: string;

  @IsOptional()
  @IsUrl()
  receiptUrl?: string;
}