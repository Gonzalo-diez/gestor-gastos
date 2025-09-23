import { IsISO8601, IsOptional, IsString, IsEnum } from 'class-validator';
import { CategoryType } from '../../categories/dto/category-type.enum';

export class SummaryDto {
  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;

  @IsOptional() @IsString() accountId?: string;
  @IsOptional() @IsString() categoryId?: string;

  @IsOptional() @IsEnum(CategoryType) type?: CategoryType; // INCOME | EXPENSE (filtro)
}