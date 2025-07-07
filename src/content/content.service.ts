import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Content, ContentDocument } from './content.schema';
import { ContentDetailResponse, CreateContentResponseDto, ContentWithAssetsDto } from './dto';

// Import all related schemas
import { Image, ImageDocument } from '../media-processing/schemas/image.schema';
import { Poster, PosterDocument } from '../posters/schemas/poster.schema';
import { TitleLogo, TitleLogoDocument } from '../ai-assets/schemas/title-logo.schema';
import { Tagline, TaglineDocument } from '../ai-assets/schemas/tagline.schema';
import { Copy, CopyDocument } from '../ai-assets/schemas/copy.schema';
import { AIImage, AIImageDocument } from '../ai-assets/schemas/ai-image.schema';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);
  private readonly baseUrl = 'https://stageapi.stage.in/nest/cms/content';
  private readonly authToken = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3NTM1MDg1NzQsImlhdCI6MTc1MDkxNjU3NCwickV4cCI6MTc1MzUwODU3NDEzNCwicklkIjoiIiwidHlwZSI6ImFjY2VzcyIsInVzZXJJZCI6IjY4MjMyNmUwNDU1ZmFlYTY2ZDMzMzk4ZCJ9.XYHKoTjiy0WfLQUxki2bba_6Ysu1YqRloqpXgE34WQw';

  constructor(
    @InjectModel(Content.name) private contentModel: Model<ContentDocument>,
    @InjectModel(Image.name) private imageModel: Model<ImageDocument>,
    @InjectModel(Poster.name) private posterModel: Model<PosterDocument>,
    @InjectModel(TitleLogo.name) private titleLogoModel: Model<TitleLogoDocument>,
    @InjectModel(Tagline.name) private taglineModel: Model<TaglineDocument>,
    @InjectModel(Copy.name) private copyModel: Model<CopyDocument>,
    @InjectModel(AIImage.name) private aiImageModel: Model<AIImageDocument>,
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

  async getAllContent(page: number = 1, perPage: number = 100, dialect: string = 'har') {
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
      
      // Filter active content items
      const filteredData = this.filterActiveContent(data);
      
      return filteredData;
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

  async searchContent(keyword: string, dialect: string = 'har') {
    try {
      const params = new URLSearchParams({
        keyword: keyword,
        page: '1',
        perPage: '100',
        dialect: dialect
      });

      const url = `${this.baseUrl}/search?${params.toString()}`;
      
      this.logger.log(`Searching content from: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'authorization': `Bearer ${this.authToken}`,
          'content-type': 'application/json'
        }
      });

      if (!response.ok) {
        this.logger.error(`Search API request failed with status: ${response.status}`);
        throw new HttpException(
          `Failed to search content: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      this.logger.log(`Successfully searched content with keyword: ${keyword}, found ${data?.data?.length || 0} items`);
      
      // Filter active content items
      const filteredData = this.filterActiveContent(data);
      
      return filteredData;
    } catch (error) {
      this.logger.error('Error searching content:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while searching content',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Filter content items to only include active items
   * @param data - Response data from external API
   * @returns Filtered data with only active items
   */
  private filterActiveContent(data: any): any {
    if (!data || !data.data || !Array.isArray(data.data)) {
      return data;
    }

    const filteredItems = data.data.filter(item => {
      // Check if item has status property and it's active/Active
      const status = item?.status;
      return status && (status.toLowerCase() === 'active');
    });

    this.logger.log(`Filtered ${data.data.length} items to ${filteredItems.length} active items`);

    return {
      ...data,
      data: filteredItems,
      // Update count if it exists
      ...(data.total && { total: filteredItems.length }),
      ...(data.count && { count: filteredItems.length })
    };
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
      console.log(data);
      
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

  async getContentByContentId(content_id: string): Promise<Content> {
    try {
      this.logger.log(`Fetching content by ID: ${content_id}`);

      const content = await this.contentModel.findOne({ content_id }).exec();
      
      if (!content) {
        throw new HttpException(
          `Content with ID '${content_id}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

      this.logger.log(`Successfully fetched content with ID: ${content_id}`);
      return content;

    } catch (error) {
      this.logger.error('Error fetching content by ID:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while fetching content',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getContentBySlug(slug: string): Promise<Content> {
    try {
      this.logger.log(`Fetching content by slug: ${slug}`);

      const content = await this.contentModel.findOne({ slug }).exec();
      
      if (!content) {
        throw new HttpException(
          `Content with slug '${slug}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

      this.logger.log(`Successfully fetched content with slug: ${slug}`);
      return content;

    } catch (error) {
      this.logger.error('Error fetching content by slug:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while fetching content',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getContentWithAllAssets(content_id: string): Promise<ContentWithAssetsDto> {
    try {
      console.log(`🔍 Fetching content and all assets for: ${content_id}`);

      // Fetch content
      const content = await this.contentModel.findOne({ content_id }).exec();
      if (!content) {
        throw new HttpException('Content not found', HttpStatus.NOT_FOUND);
      }

      // Fetch all related assets in parallel
      const [images, posters, titleLogos, taglines, copies, aiImages] = await Promise.all([
        this.imageModel.find({ content_id }).exec(),
        this.posterModel.find({ content_id }).exec(),
        this.titleLogoModel.find({ content_id }).exec(),
        this.taglineModel.find({ content_id }).exec(),
        this.copyModel.find({ content_id }).exec(),
        this.aiImageModel.find({ content_id }).exec(),
      ]);

      console.log(`📊 Assets found - Images: ${images.length}, Posters: ${posters.length}, Title Logos: ${titleLogos.length}, Taglines: ${taglines.length}, Copies: ${copies.length}, AI Images: ${aiImages.length}`);

      // Build response
      const response: ContentWithAssetsDto = {
        content: {
          content_id: content.content_id,
          title: content.title,
          description: content.description,
          genre: content.genre,
          language: content.language,
          created_at: content.created_at,
        },
        images: images.map(img => ({
          image_id: img.images_id,
          image_url: img.image_url,
          image_type: img.source,
          created_at: img.created_at,
        })),
        posters: posters.map(poster => ({
          poster_id: poster.poster_id,
          poster_url: poster.poster_url,
          poster_type: poster.poster_type,
          slug: poster.slug,
          channel: poster.channel,
          dimension: poster.dimension,
          use_case: poster.use_case,
          prompt_text: poster.prompt_text,
          created_at: poster.created_at,
        })),
        title_logos: titleLogos.map(logo => ({
          title_logo_id: logo.title_logo_id,
          title_logo_url: logo.title_logo_url,
          created_at: logo.created_at,
        })),
        taglines: taglines.map(tagline => ({
          tagline_id: tagline.tagline_id,
          text: tagline.text,
          created_at: tagline.created_at,
        })),
        copies: copies.map(copy => ({
          copy_id: copy.copy_id,
          text: copy.text,
          created_at: copy.created_at,
        })),
        ai_images: aiImages.map(aiImg => ({
          ai_image_id: aiImg.ai_image_id,
          ai_image_url: aiImg.ai_image_url,
          created_at: aiImg.created_at,
        })),
        summary: {
          total_images: images.length,
          total_posters: posters.length,
          total_title_logos: titleLogos.length,
          total_taglines: taglines.length,
          total_copies: copies.length,
          total_ai_images: aiImages.length,
          last_updated: new Date(),
        },
      };

      console.log(`✅ Content with assets fetched successfully`);
      return response;

    } catch (error) {
      console.error('❌ Error fetching content with assets:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch content with assets',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
