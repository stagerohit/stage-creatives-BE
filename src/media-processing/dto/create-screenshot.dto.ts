import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ImageSource } from '../schemas/image.schema';
import { Dimension } from '../../schemas/common/dimension.enum';

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
  @IsEnum(Dimension, { message: 'Dimension is not valid' })
  dimension?: Dimension;

  @IsOptional()
  timestamp?: number;

  // Source is automatically set to VIDEO_UPLOAD for screenshots
  source: ImageSource = ImageSource.VIDEO_UPLOAD;
} 