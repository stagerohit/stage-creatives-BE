import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Content, ContentDocument } from './content.schema';
import { ContentDetailResponse, CreateContentResponseDto } from './dto';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);
  private readonly baseUrl = 'https://stageapi.stage.in/nest/cms/content';
  private readonly authToken = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3NTM1MDg1NzQsImlhdCI6MTc1MDkxNjU3NCwickV4cCI6MTc1MzUwODU3NDEzNCwicklkIjoiIiwidHlwZSI6ImFjY2VzcyIsInVzZXJJZCI6IjY4MjMyNmUwNDU1ZmFlYTY2ZDMzMzk4ZCJ9.XYHKoTjiy0WfLQUxki2bba_6Ysu1YqRloqpXgE34WQw';

  constructor(
    @InjectModel(Content.name) private contentModel: Model<ContentDocument>
  ) {}

  /**
   * Helper method to build full trailer URL from filename
   * @param trailerValue - Could be filename or full URL
   * @returns Full trailer URL
   */
  private buildTrailerUrl(trailerValue: string): string {
    if (!trailerValue) {
      return '';
    }

    // If it's already a full URL, return as is
    if (trailerValue.startsWith('http://') || trailerValue.startsWith('https://')) {
      return trailerValue;
    }

    // If it's just a filename, construct full URL
    return `https://media.stage.in/show/main-video/480/${trailerValue}`;
  }

  async createContent(slug: string): Promise<CreateContentResponseDto> {
    try {
      this.logger.log(`Creating content for slug: ${slug}`);

      // Call existing getContentDetail method to fetch content data
      const contentDetailResponse: ContentDetailResponse = await this.getContentDetail(slug);
      
      // Extract data from the response according to the mapping
      const rawTrailerUrl = contentDetailResponse.show.meta.hin.trailer?.sourceLink || '';
      
      const contentData = {
        slug: contentDetailResponse.show.meta.hin.slug,
        title: contentDetailResponse.show.meta.hin.title,
        description: contentDetailResponse.show.meta.hin.description,
        trailler_url: this.buildTrailerUrl(rawTrailerUrl),
        dialect: contentDetailResponse.dialect,
        // Required fields with default values
        content_type: 'Show', // Default content type
        language: 'hin',    // Default language based on dialect
        // Optional fields
        genre: ''
      };
      
      this.logger.log(`Raw trailer: ${rawTrailerUrl} → Full URL: ${contentData.trailler_url}`);

      // Create new content document
      const newContent = new this.contentModel(contentData);
      
      // Save to MongoDB
      const savedContent = await newContent.save();
      
      this.logger.log(`Successfully created content with ID: ${savedContent.content_id}`);

      return {
        message: 'Content created successfully',
        content_id: savedContent.content_id,
        slug: savedContent.slug
      };

    } catch (error) {
      this.logger.error('Error creating content:', error);
      
      // Handle duplicate key error (slug already exists)
      if (error.code === 11000) {
        throw new HttpException(
          `Content with slug '${slug}' already exists`,
          HttpStatus.CONFLICT
        );
      }
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while creating content',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllContent(page: number = 1, perPage: number = 10, dialect: string = 'har') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
        dialect: dialect
      });

      const url = `${this.baseUrl}/all?${params.toString()}`;
      
      this.logger.log(`Fetching content from: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'authorization': `Bearer ${this.authToken}`,
          'content-type': 'application/json'
        }
      });

      if (!response.ok) {
        this.logger.error(`API request failed with status: ${response.status}`);
        throw new HttpException(
          `Failed to fetch content: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      this.logger.log(`Successfully fetched ${data?.data?.length || 0} content items`);
      
      return data;
    } catch (error) {
      this.logger.error('Error fetching content:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while fetching content',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getContentDetail(slug: string, dialect: string = 'har') {
    try {
      const params = new URLSearchParams({
        slug: slug
      });

      const url = `${this.baseUrl}/get/show-detail?${params.toString()}`;
      
      this.logger.log(`Fetching content detail from: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'authorization': `Bearer ${this.authToken}`,
          'content-type': 'application/json',
          'dialect': dialect,
          'lang': 'en',
          'os': 'other',
          'platform': 'web'
        }
      });

      if (!response.ok) {
        this.logger.error(`API request failed with status: ${response.status}`);
        throw new HttpException(
          `Failed to fetch content detail: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      this.logger.log(`Successfully fetched content detail for slug: ${slug}`);
      
      return data;
    } catch (error) {
      this.logger.error('Error fetching content detail:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while fetching content detail',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
