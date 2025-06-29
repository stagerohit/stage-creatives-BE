import { Controller, Post, Get, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { TaglineService } from '../services/tagline.service';
import { CreateTaglineDto } from '../dto';
import { Tagline } from '../schemas/tagline.schema';

@Controller('taglines')
export class TaglineController {
  constructor(private readonly taglineService: TaglineService) {}

  /**
   * Generate a new tagline image
   * POST /taglines/generate
   */
  @Post('generate')
  async generateTagline(@Body() createTaglineDto: CreateTaglineDto): Promise<Tagline> {
    try {
      console.log('🎯 Tagline Controller - generateTagline called');
      console.log('📊 Request body:', createTaglineDto);
      
      const result = await this.taglineService.generateTagline(createTaglineDto);
      
      console.log('✅ Tagline generated successfully:', result.tagline_id);
      return result;
    } catch (error) {
      console.error('❌ Tagline generation failed:', error.message);
      console.error('🔍 Error details:', error);
      throw new HttpException(
        error.message || 'Failed to generate tagline',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a specific tagline by ID
   * GET /taglines/:tagline_id
   */
  @Get(':tagline_id')
  async getTaglineById(@Param('tagline_id') tagline_id: string): Promise<Tagline> {
    try {
      console.log('🔍 Tagline Controller - getTaglineById called');
      console.log('📊 Tagline ID:', tagline_id);
      
      const result = await this.taglineService.getTaglineById(tagline_id);
      
      console.log('✅ Tagline found:', result.tagline_id);
      return result;
    } catch (error) {
      console.error('❌ Failed to get tagline:', error.message);
      throw new HttpException(
        error.message || 'Tagline not found',
        error.status || HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Get all taglines for a specific content
   * GET /taglines/content/:content_id
   */
  @Get('content/:content_id')
  async getTaglinesByContentId(@Param('content_id') content_id: string): Promise<Tagline[]> {
    try {
      console.log('🔍 Tagline Controller - getTaglinesByContentId called');
      console.log('📊 Content ID:', content_id);
      
      const result = await this.taglineService.getTaglinesByContentId(content_id);
      
      console.log('✅ Taglines found:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Failed to get taglines by content ID:', error.message);
      throw new HttpException(
        error.message || 'Failed to retrieve taglines',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 