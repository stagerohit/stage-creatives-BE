import { IsString, IsUUID, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { Channel } from '../../schemas/common/channel.enum';

export class CreateCopyDto {
  // Content ID from Content collection
  @IsUUID()
  @IsNotEmpty()
  content_id: string;

  // Slug from Content collection
  @IsString()
  @IsNotEmpty()
  slug: string;

  // Input text for copy generation
  @IsString()
  @IsNotEmpty()
  text: string;

  // Optional styling prompt for copy generation
  @IsOptional()
  @IsString()
  copy_prompt?: string;

  // Optional channel for targeting specific platforms
  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;
} 