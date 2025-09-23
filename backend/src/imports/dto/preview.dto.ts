import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class PreviewDto {
  @IsOptional() @IsString() worksheet?: string;   // XLSX
  @IsOptional() @IsString() delimiter?: string;   // CSV ; , \t |
  @IsOptional() @IsInt() @Min(1) sampleSize = 20;
}