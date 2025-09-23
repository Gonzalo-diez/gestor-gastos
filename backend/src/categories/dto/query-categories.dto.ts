import { IsEnum, IsOptional } from 'class-validator';
import { CategoryType } from './category-type.enum';

export class QueryCategoriesDto {
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType; // INCOME | EXPENSE
}