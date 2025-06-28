import { IsNumberString, IsOptional, Min, Max } from 'class-validator';

export class TriggerScreenshotsDto {
  @IsOptional()
  @IsNumberString()
  @Min(100) // Minimum 100ms between screenshots
  @Max(300000) // Maximum 5 minutes between screenshots
  pulse?: string; // Screenshot interval in milliseconds (default: 60000ms = 1 minute)
} 