import { IsEmail, MinLength, IsOptional, IsString } from 'class-validator';

export class RegisterDto {
  @IsEmail() email: string;
  @MinLength(8) password: string;
  @IsOptional() @IsString() name?: string;
}
