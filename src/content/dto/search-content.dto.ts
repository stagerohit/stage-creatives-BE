import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class SearchContentDto {
  @IsString()
  @IsNotEmpty()
  keyword: string;

  @IsString()
  @IsIn(['har', 'raj', 'bho'], { message: 'Dialect must be one of: har, raj, bho' })
  dialect: string;
} 