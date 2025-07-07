import { IsString, IsUUID, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { Channel } from '../schemas/title-logo.schema';
import { Dimension } from '../../schemas/common/dimension.enum';

export class CreateTitleLogoDto {
  @IsUUID()
  @IsNotEmpty()
  content_id: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  title_prompt: string;

  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  @IsOptional()
  @IsEnum(Dimension, { message: 'Dimension is not valid' })
  dimension?: Dimension;
} 