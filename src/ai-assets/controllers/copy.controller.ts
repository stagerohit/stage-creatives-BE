import { Controller, Post, Get, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { CopyService } from '../services/copy.service';
import { CreateCopyDto } from '../dto';
import { Copy } from '../schemas/copy.schema';

@Controller('copies')
export class CopyController {
  constructor(private readonly copyService: CopyService) {}

  /**
   * Generate a new copy text
   * POST /copies/generate
   */
  @Post('generate')
  async generateCopy(@Body() createCopyDto: CreateCopyDto): Promise<Copy> {
    try {
      console.log('🎯 Copy Controller - generateCopy called');
      console.log('📊 Request body:', createCopyDto);
      
      const result = await this.copyService.generateCopy(createCopyDto);
      
      console.log('✅ Copy generated successfully:', result.copy_id);
      return result;
    } catch (error) {
      console.error('❌ Copy generation failed:', error.message);
      console.error('🔍 Error details:', error);
      throw new HttpException(
        error.message || 'Failed to generate copy',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a specific copy by ID
   * GET /copies/:copy_id
   */
  @Get(':copy_id')
  async getCopyById(@Param('copy_id') copy_id: string): Promise<Copy> {
    try {
      console.log('🔍 Copy Controller - getCopyById called');
      console.log('📊 Copy ID:', copy_id);
      
      const result = await this.copyService.getCopyById(copy_id);
      
      console.log('✅ Copy found:', result.copy_id);
      return result;
    } catch (error) {
      console.error('❌ Failed to get copy:', error.message);
      throw new HttpException(
        error.message || 'Copy not found',
        error.status || HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Get all copies for a specific content
   * GET /copies/content/:content_id
   */
  @Get('content/:content_id')
  async getCopiesByContentId(@Param('content_id') content_id: string): Promise<Copy[]> {
    try {
      console.log('🔍 Copy Controller - getCopiesByContentId called');
      console.log('📊 Content ID:', content_id);
      
      const result = await this.copyService.getCopiesByContentId(content_id);
      
      console.log('✅ Copies found:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Failed to get copies by content ID:', error.message);
      throw new HttpException(
        error.message || 'Failed to retrieve copies',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 