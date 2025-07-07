import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { Channel } from '../../schemas/common/channel.enum';

export class CopyQueryDto {
  // Filter by Content ID
  @IsOptional()
  @IsString()
  content_id?: string;

  // Filter by slug
  @IsOptional()
  @IsString()
  slug?: string;

  // Filter by input text
  @IsOptional()
  @IsString()
  text?: string;

  // Filter by generated copy
  @IsOptional()
  @IsString()
  copy?: string;

  // Filter by channel
  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  // Pagination: page number
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  // Pagination: items per page
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  // Sort field
  @IsOptional()
  @IsString()
  sort?: string = 'created_at';

  // Sort order
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
} 