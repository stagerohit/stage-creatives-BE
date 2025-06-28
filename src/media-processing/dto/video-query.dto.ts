import { IsOptional, IsString, IsEnum } from 'class-validator';
import { VideoProcessingStatus } from '../schemas/video.schema';

export class VideoQueryDto {
  @IsOptional()
  @IsString()
  content_id?: string;

  @IsOptional()
  @IsEnum(VideoProcessingStatus)
  processing_status?: VideoProcessingStatus;

  @IsOptional()
  @IsString()
  slug?: string;
} 