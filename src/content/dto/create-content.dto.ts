import { IsString, IsNotEmpty } from 'class-validator';

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  slug: string;
} 