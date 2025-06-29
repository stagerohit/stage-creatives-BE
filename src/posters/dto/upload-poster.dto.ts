import { IsString, IsUUID, IsOptional, IsEnum, IsArray } from 'class-validator';
import { Channel, UseCase, AIDimension } from '../../ai-assets/schemas/ai-image.schema';

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
  @IsEnum(AIDimension)
  dimension?: AIDimension;

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