import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { ColumnMapDto } from './column-map.dto';

export enum CreateBudgetsMode {
  NONE = 'none',
  SUM = 'sum',
}

export class ConfirmDto {
  @IsString()
  batchId: string;

  @ValidateNested()
  @Type(() => ColumnMapDto)
  columnMap: ColumnMapDto;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsBoolean()
  createMissingCategories = true;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rowsToImport?: string[];

  // presupuestos
  @IsOptional()
  @IsEnum(CreateBudgetsMode)
  createBudgets: CreateBudgetsMode = CreateBudgetsMode.NONE;

  @IsOptional()
  @IsBoolean()
  budgetPeriodFromRow = true; // usar YYYY-MM derivado de la fecha de cada fila

  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) // YYYY-MM
  fixedPeriod?: string;

  @IsOptional()
  @IsBoolean()
  overwriteBudgets = false; // si true => upsert, si false => solo crea si no existe
}
