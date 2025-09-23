import { IsOptional, IsString, IsISO8601, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTransactionsDto {
  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;

  @IsOptional() @IsString() accountId?: string;
  @IsOptional() @IsString() categoryId?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(200) pageSize = 20;
}