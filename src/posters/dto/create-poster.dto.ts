import { IsString, IsUUID, IsOptional, IsEnum, IsArray, ArrayMinSize, ValidateIf } from 'class-validator';
import { UseCase } from '../../ai-assets/schemas/ai-image.schema';
import { Dimension } from '../../schemas/common/dimension.enum';
import { Channel } from '../../schemas/common/channel.enum';

export class CreatePosterDto {
  @IsUUID()
  @IsString()
  content_id: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  @IsEnum(Dimension, { message: 'Dimension is not valid' })
  dimension: Dimension; // Required for Runway API ratio

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

  // Custom validation: At least one asset ID array must be non-empty
  @ValidateIf((o) => {
    const hasAssets = [
      o.ai_image_id?.length > 0,
      o.screenshot_ids?.length > 0,
      o.title_logo_id?.length > 0,
      o.copy_id?.length > 0,
      o.tagline_id?.length > 0
    ].some(Boolean);
    
    if (!hasAssets) {
      throw new Error('At least one asset ID array must be provided and non-empty');
    }
    return true;
  })
  _validation?: any;
} 