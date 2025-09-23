import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { CategoryType } from './category-type.enum';

export class UpdateCategoryDto {
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(1, 60)
  name?: string;

  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;
}