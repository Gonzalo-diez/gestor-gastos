import { IsOptional, IsString } from 'class-validator';

export class ColumnMapDto {
  @IsString() date: string;
  @IsString() amount: string;
  @IsOptional() @IsString() note?: string;

  // claves canónicas que entiende el mapper
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() type?: string; // INCOME|EXPENSE o literal

  // ALIAS que manda el e2e (si no están, whitelist los borra)
  @IsOptional() @IsString() categoryName?: string;
  @IsOptional() @IsString() categoryType?: string;
}
