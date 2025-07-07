import { IsString, IsUUID, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { Channel } from '../schemas/tagline.schema';
import { Dimension } from '../../schemas/common/dimension.enum';

export class CreateTaglineDto {
  @IsUUID()
  @IsNotEmpty()
  content_id: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsNotEmpty()
  tagline_prompt: string;

  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  @IsOptional()
  @IsEnum(Dimension, { message: 'Dimension is not valid' })
  dimension?: Dimension;
} 