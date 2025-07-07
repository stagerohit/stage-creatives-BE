import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ImageSource } from '../schemas/image.schema';
import { Dimension } from '../../schemas/common/dimension.enum';

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
  @IsEnum(Dimension, { message: 'Dimension is not valid' })
  dimension?: Dimension;

  @IsOptional()
  @IsEnum(Dimension, { message: 'Dimension is not valid' })
  timestamp?: number;
} 