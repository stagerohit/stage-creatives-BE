import { IsString, IsUUID, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { Channel, Dimension } from '../schemas/title-logo.schema';

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
  @IsEnum(Dimension)
  dimension?: Dimension;
} 