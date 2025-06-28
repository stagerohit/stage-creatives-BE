import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ImageDimension, ImageSource } from '../schemas/image.schema';

export class UploadImageDto {
  @IsString()
  @IsNotEmpty()
  content_id: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsOptional()
  @IsString()
  original_name?: string;

  @IsOptional()
  @IsEnum(ImageSource)
  source?: ImageSource = ImageSource.IMAGE_UPLOAD;

  @IsOptional()
  @IsString()
  video_id?: string;

  @IsOptional()
  @IsEnum(ImageDimension)
  dimension?: ImageDimension;
} 