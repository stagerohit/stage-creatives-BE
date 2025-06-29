import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AIImageService } from '../services/ai-image.service';
import { CreateAIImageDto, AIImageQueryDto } from '../dto';
import { AIImage } from '../schemas/ai-image.schema';

@Controller('ai-images')
export class AIImageController {
  constructor(private readonly aiImageService: AIImageService) {
    console.log('🎉 AI Image Controller initialized - Routes should be available at /ai-images/*');
  }

  @Post('generate')
  @UsePipes(new ValidationPipe({ transform: true }))
  async generateAIImage(@Body() createAIImageDto: CreateAIImageDto): Promise<AIImage> {
    console.log('🚀 AI Image Controller - Generate endpoint called');
    console.log('📝 Request body:', JSON.stringify(createAIImageDto, null, 2));
    
    try {
      console.log('🔄 Calling AI Image Service...');
      const result = await this.aiImageService.generateAIImage(createAIImageDto);
      console.log('✅ AI Image generated successfully:', result.ai_image_id);
      return result;
    } catch (error) {
      console.error('❌ AI Image generation failed:', error.message);
      console.error('🔍 Error details:', error);
      throw new HttpException(
        error.message || 'Failed to generate AI image',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':ai_image_id')
  async getAIImageById(@Param('ai_image_id') ai_image_id: string): Promise<AIImage> {
    try {
      const aiImage = await this.aiImageService.getAIImageById(ai_image_id);
      if (!aiImage) {
        throw new HttpException('AI Image not found', HttpStatus.NOT_FOUND);
      }
      return aiImage;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get AI image',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async getAllAIImages(@Query() query: AIImageQueryDto): Promise<{
    data: AIImage[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      return await this.aiImageService.getAllAIImages(query);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get AI images',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('by-image/:image_id')
  async getAIImagesByImageId(@Param('image_id') image_id: string): Promise<AIImage[]> {
    try {
      return await this.aiImageService.getAIImagesByImageId(image_id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get AI images by image ID',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('by-ai-image/:ai_image_id')
  async getAIImagesByAIImageId(@Param('ai_image_id') ai_image_id: string): Promise<AIImage[]> {
    try {
      return await this.aiImageService.getAIImagesByAIImageId(ai_image_id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get AI images by AI image ID',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('content/:content_id')
  async getAIImagesByContentId(@Param('content_id') content_id: string): Promise<AIImage[]> {
    try {
      return await this.aiImageService.getAIImagesByContentId(content_id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get AI images by content ID',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 