import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ImageSource } from '../schemas/image.schema';

export class ImageQueryDto {
  @IsOptional()
  @IsString()
  content_id?: string;

  @IsOptional()
  @IsString()
  video_id?: string;

  @IsOptional()
  @IsEnum(ImageSource)
  source?: ImageSource;
} 