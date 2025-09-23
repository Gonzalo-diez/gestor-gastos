import { IsISO8601, IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CategoryType } from '../../categories/dto/category-type.enum';

export class TopCategoriesDto {
  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;

  @IsOptional() @IsString() accountId?: string;

  @IsEnum(CategoryType) type: CategoryType = CategoryType.EXPENSE;

  @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit: number = 5;
}