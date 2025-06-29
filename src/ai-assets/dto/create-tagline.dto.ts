import { IsString, IsUUID, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { Channel, Dimension } from '../schemas/tagline.schema';

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
  @IsEnum(Dimension)
  dimension?: Dimension;
} 