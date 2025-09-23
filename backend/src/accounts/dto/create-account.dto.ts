import { IsString, Length } from 'class-validator';
export class CreateAccountDto {
  @IsString() name: string;
  @IsString() @Length(3,3) currencyCode: string; // ISO
}