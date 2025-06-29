import { IsString, IsOptional, IsArray, IsEnum, MinLength, MaxLength, IsUUID } from 'class-validator';
import { Channel, UseCase, AIDimension } from '../schemas/ai-image.schema';

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

  @IsEnum(AIDimension)
  dimension: AIDimension;

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