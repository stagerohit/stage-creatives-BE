import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';

export class ContentResponseDto {
  @IsString()
  content_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  release_date?: string;

  @IsOptional()
  @IsString()
  director?: string;

  @IsOptional()
  @IsArray()
  cast?: string[];

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  rating?: string;

  @IsDateString()
  created_at: Date;
}

export class ContentWithAssetsDto {
  // Content Information
  content: {
    content_id: string;
    title: string;
    description: string;
    genre?: string;
    language?: string;
    created_at: Date;
  };

  // Related Assets
  images: {
    image_id: string;
    image_url: string;
    image_type: string;
    created_at: Date;
  }[];

  posters: {
    poster_id: string;
    poster_url: string;
    poster_type: string;
    slug: string;
    channel?: string;
    dimension?: string;
    use_case?: string;
    prompt_text: string;
    created_at: Date;
  }[];

  title_logos: {
    title_logo_id: string;
    title_logo_url: string;
    created_at: Date;
  }[];

  taglines: {
    tagline_id: string;
    text: string;
    created_at: Date;
  }[];

  copies: {
    copy_id: string;
    text: string;
    created_at: Date;
  }[];

  ai_images: {
    ai_image_id: string;
    ai_image_url: string;
    created_at: Date;
  }[];

  // Summary Statistics
  summary: {
    total_images: number;
    total_posters: number;
    total_title_logos: number;
    total_taglines: number;
    total_copies: number;
    total_ai_images: number;
    last_updated: Date;
  };
}

export interface ContentDetailResponse {
  show: {
    meta: {
      hin: {
        slug: string;
        title: string;
        description: string;
        trailer: {
          sourceLink: string;
        };
      };
    };
  };
  dialect: string;
}

export class CreateContentResponseDto {
  message: string;
  content_id: string;
  slug: string;
} 