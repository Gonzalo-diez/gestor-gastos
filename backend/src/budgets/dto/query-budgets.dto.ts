import { IsOptional, IsString, Matches } from 'class-validator';
const PERIOD_RX = /^(\d{4}-(0[1-9]|1[0-2])|MONTHLY)$/;

export class QueryBudgetsDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @Matches(PERIOD_RX) period?: string; // filtra un periodo
}