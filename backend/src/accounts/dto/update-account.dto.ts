import { IsOptional, IsString, Length } from 'class-validator';
export class UpdateAccountDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() @Length(3,3) currencyCode?: string;
}