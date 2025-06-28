import { IsString, IsOptional, IsNumberString, IsNotEmpty, Min, Max } from 'class-validator';

export class UploadVideoDto {
  @IsString()
  @IsNotEmpty()
  content_id: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsNumberString()
  @Min(100) // Minimum 100ms between screenshots
  @Max(300000) // Maximum 5 minutes between screenshots
  pulse?: string; // Screenshot interval in milliseconds
} 