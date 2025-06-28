import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ImageDimension, ImageSource } from '../schemas/image.schema';

export class CreateScreenshotDto {
  @IsString()
  @IsNotEmpty()
  content_id: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  video_id: string;

  @IsString()
  @IsNotEmpty()
  original_name: string;

  @IsString()
  @IsNotEmpty()
  image_url: string;

  @IsOptional()
  @IsEnum(ImageDimension)
  dimension?: ImageDimension;

  @IsOptional()
  timestamp?: number;

  // Source is automatically set to VIDEO_UPLOAD for screenshots
  source: ImageSource = ImageSource.VIDEO_UPLOAD;
} 