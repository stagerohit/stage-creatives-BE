import { IsString, IsOptional, IsArray, IsEnum, MinLength, MaxLength, IsUUID } from 'class-validator';
import { UseCase } from '../schemas/ai-image.schema';
import { Dimension } from '../../schemas/common/dimension.enum';
import { Channel } from '../../schemas/common/channel.enum';

export class CreateAIImageDto {
  @IsString()
  @IsUUID()
  content_id: string;

  @IsString()
  @MinLength(1)
  slug: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  prompt: string;

  @IsEnum(Dimension, { message: 'Dimension is not valid' })
  dimension: Dimension;

  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  @IsOptional()
  @IsEnum(UseCase)
  use_case?: UseCase;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image_ids?: string[]; // Array of image IDs from Images collection
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ai_image_ids?: string[]; // Array of AI image IDs from AIImages collection
} 