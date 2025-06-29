import { Controller, Post, Get, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { TitleLogoService } from '../services/title-logo.service';
import { CreateTitleLogoDto } from '../dto';
import { TitleLogo } from '../schemas/title-logo.schema';

@Controller('title-logos')
export class TitleLogoController {
  constructor(private readonly titleLogoService: TitleLogoService) {}

  /**
   * Generate a new title logo
   * POST /title-logos/generate
   */
  @Post('generate')
  async generateTitleLogo(@Body() createTitleLogoDto: CreateTitleLogoDto): Promise<TitleLogo> {
    try {
      console.log('🎯 TitleLogo Controller - generateTitleLogo called');
      console.log('📊 Request body:', createTitleLogoDto);
      
      const result = await this.titleLogoService.generateTitleLogo(createTitleLogoDto);
      
      console.log('✅ Title logo generated successfully:', result.title_logo_id);
      return result;
    } catch (error) {
      console.error('❌ Title logo generation failed:', error.message);
      console.error('🔍 Error details:', error);
      throw new HttpException(
        error.message || 'Failed to generate title logo',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a specific title logo by ID
   * GET /title-logos/:title_logo_id
   */
  @Get(':title_logo_id')
  async getTitleLogoById(@Param('title_logo_id') title_logo_id: string): Promise<TitleLogo> {
    try {
      console.log('🔍 TitleLogo Controller - getTitleLogoById called');
      console.log('📊 Title Logo ID:', title_logo_id);
      
      const result = await this.titleLogoService.getTitleLogoById(title_logo_id);
      
      console.log('✅ Title logo found:', result.title_logo_id);
      return result;
    } catch (error) {
      console.error('❌ Failed to get title logo:', error.message);
      throw new HttpException(
        error.message || 'Title logo not found',
        error.status || HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Get all title logos for a specific content
   * GET /title-logos/content/:content_id
   */
  @Get('content/:content_id')
  async getTitleLogosByContentId(@Param('content_id') content_id: string): Promise<TitleLogo[]> {
    try {
      console.log('🔍 TitleLogo Controller - getTitleLogosByContentId called');
      console.log('📊 Content ID:', content_id);
      
      const result = await this.titleLogoService.getTitleLogosByContentId(content_id);
      
      console.log('✅ Title logos found:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Failed to get title logos by content ID:', error.message);
      throw new HttpException(
        error.message || 'Failed to retrieve title logos',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 