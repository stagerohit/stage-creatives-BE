import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Channel, UseCase } from '../../ai-assets/schemas/ai-image.schema';
import { PosterType } from '../schemas/poster.schema';
import { Dimension } from '../../schemas/common/dimension.enum';

export class PosterQueryDto {
  @IsOptional()
  @IsString()
  content_id?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  @IsOptional()
  @IsEnum(Dimension, { message: 'Dimension is not valid' })
  dimension?: Dimension;

  @IsOptional()
  @IsEnum(UseCase)
  use_case?: UseCase;

  @IsOptional()
  @IsEnum(PosterType)
  poster_type?: PosterType;

  @IsOptional()
  @IsString()
  prompt_text?: string;

  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  // Sorting
  @IsOptional()
  @IsString()
  sort?: string = 'created_at';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
} 