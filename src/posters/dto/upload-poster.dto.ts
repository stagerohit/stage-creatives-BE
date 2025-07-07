import { IsString, IsUUID, IsOptional, IsEnum, IsArray } from 'class-validator';
import { UseCase } from '../../ai-assets/schemas/ai-image.schema';
import { Dimension } from '../../schemas/common/dimension.enum';
import { Channel } from '../../schemas/common/channel.enum';

export class UploadPosterDto {
  @IsUUID()
  @IsString()
  content_id: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  @IsOptional()
  @IsEnum(Dimension, { message: 'Dimension is not valid' })
  dimension?: Dimension;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ai_image_id?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  screenshot_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  title_logo_id?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  copy_id?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagline_id?: string[];

  @IsOptional()
  @IsEnum(UseCase)
  use_case?: UseCase;
} 