import { IsString, IsOptional, IsArray, IsEnum, MinLength, MaxLength, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UseCase } from '../schemas/ai-image.schema';
import { Channel } from '../../schemas/common/channel.enum';

class ReferenceImageDto {
  @IsString()
  @MinLength(1)
  uri: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  tag: string;
}

export class CreateAIImageRunwayDto {
  @IsString()
  @IsUUID()
  content_id: string;

  @IsString()
  @MinLength(1)
  slug: string;

  @IsString()
  @MinLength(1)
  ratio: string; // '1920:1080', '1080:1920', etc.

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  promptText: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenceImageDto)
  referenceImages: ReferenceImageDto[];

  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  @IsOptional()
  @IsEnum(UseCase)
  use_case?: UseCase;
} 