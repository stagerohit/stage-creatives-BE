import { 
  Controller, 
  Post, 
  Get, 
  Param, 
  Body, 
  Query,
  UseInterceptors,
  UploadedFile,
  HttpException, 
  HttpStatus,
  Options,
  Res 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { PosterService } from '../services/poster.service';
import { CreatePosterDto, UploadPosterDto, PosterQueryDto } from '../dto';
import { Poster, PosterType } from '../schemas/poster.schema';

@Controller('posters')
export class PosterController {
  constructor(private readonly posterService: PosterService) {}

  /**
   * Generate a new poster with AI (Runway API)
   * POST /posters/generate
   */
  @Post('generate')
  async generatePoster(@Body() createPosterDto: CreatePosterDto): Promise<Poster> {
    try {
      console.log('🎯 Poster Controller - generatePoster called');
      console.log('📊 Request body:', createPosterDto);
      
      const result = await this.posterService.generatePoster(createPosterDto);
      
      console.log('✅ Poster generated successfully:', result.poster_id);
      return result;
    } catch (error) {
      console.error('❌ Poster generation failed:', error.message);
      console.error('🔍 Error details:', error);
      throw new HttpException(
        error.message || 'Failed to generate poster',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Handle preflight OPTIONS request for poster upload
   * OPTIONS /posters/upload
   */
  @Options('upload')
  async uploadPosterOptions(@Res() res: Response): Promise<void> {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    res.status(200).end();
  }

  /**
   * Upload a human-created poster
   * POST /posters/upload
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('poster', {
    storage: memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  }))
  async uploadPoster(
    @Body() uploadPosterDto: UploadPosterDto,
    @UploadedFile() file: Express.Multer.File
  ): Promise<Poster> {
    try {
      console.log('🎯 Poster Controller - uploadPoster called');
      console.log('📊 Request body:', uploadPosterDto);
      console.log('📎 File:', file?.originalname);
      
      if (!file) {
        throw new HttpException('Poster file is required', HttpStatus.BAD_REQUEST);
      }

      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new HttpException(
          'Invalid file type. Only JPEG, PNG, GIF, and WebP files are allowed',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new HttpException('File size too large. Maximum 10MB allowed', HttpStatus.BAD_REQUEST);
      }
      
      const result = await this.posterService.uploadPoster(uploadPosterDto, file);
      
      console.log('✅ Poster uploaded successfully:', result.poster_id);
      return result;
    } catch (error) {
      console.error('❌ Poster upload failed:', error.message);
      console.error('🔍 Error details:', error);
      throw new HttpException(
        error.message || 'Failed to upload poster',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a specific poster by ID
   * GET /posters/:poster_id
   */
  @Get(':poster_id')
  async getPosterById(@Param('poster_id') poster_id: string): Promise<Poster> {
    try {
      console.log('🔍 Poster Controller - getPosterById called');
      console.log('📊 Poster ID:', poster_id);
      
      const result = await this.posterService.getPosterById(poster_id);
      
      console.log('✅ Poster found:', result.poster_id);
      return result;
    } catch (error) {
      console.error('❌ Failed to get poster:', error.message);
      throw new HttpException(
        error.message || 'Poster not found',
        error.status || HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Get all posters with filtering and pagination
   * GET /posters
   */
  @Get()
  async getAllPosters(@Query() query: PosterQueryDto): Promise<{
    data: Poster[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      console.log('🔍 Poster Controller - getAllPosters called');
      console.log('📊 Query params:', query);
      
      const result = await this.posterService.getAllPosters(query);
      
      console.log('✅ Posters found:', result.data.length);
      return result;
    } catch (error) {
      console.error('❌ Failed to get posters:', error.message);
      throw new HttpException(
        error.message || 'Failed to retrieve posters',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all posters for a specific content
   * GET /posters/content/:content_id
   */
  @Get('content/:content_id')
  async getPostersByContentId(@Param('content_id') content_id: string): Promise<Poster[]> {
    try {
      console.log('🔍 Poster Controller - getPostersByContentId called');
      console.log('📊 Content ID:', content_id);
      
      const result = await this.posterService.getPostersByContentId(content_id);
      
      console.log('✅ Posters found:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Failed to get posters by content ID:', error.message);
      throw new HttpException(
        error.message || 'Failed to retrieve posters',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all posters for a specific channel
   * GET /posters/channel/:channel
   */
  @Get('channel/:channel')
  async getPostersByChannel(@Param('channel') channel: string): Promise<Poster[]> {
    try {
      console.log('🔍 Poster Controller - getPostersByChannel called');
      console.log('📊 Channel:', channel);
      
      const result = await this.posterService.getPostersByChannel(channel);
      
      console.log('✅ Posters found:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Failed to get posters by channel:', error.message);
      throw new HttpException(
        error.message || 'Failed to retrieve posters',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all posters for a specific use case
   * GET /posters/use-case/:use_case
   */
  @Get('use-case/:use_case')
  async getPostersByUseCase(@Param('use_case') use_case: string): Promise<Poster[]> {
    try {
      console.log('🔍 Poster Controller - getPostersByUseCase called');
      console.log('📊 Use Case:', use_case);
      
      const result = await this.posterService.getPostersByUseCase(use_case);
      
      console.log('✅ Posters found:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Failed to get posters by use case:', error.message);
      throw new HttpException(
        error.message || 'Failed to retrieve posters',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all posters by type (AI generated vs human uploaded)
   * GET /posters/type/:poster_type
   */
  @Get('type/:poster_type')
  async getPostersByType(@Param('poster_type') poster_type: PosterType): Promise<Poster[]> {
    try {
      console.log('🔍 Poster Controller - getPostersByType called');
      console.log('📊 Poster Type:', poster_type);
      
      const result = await this.posterService.getPostersByType(poster_type);
      
      console.log('✅ Posters found:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Failed to get posters by type:', error.message);
      throw new HttpException(
        error.message || 'Failed to retrieve posters',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 