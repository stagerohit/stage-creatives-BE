import { Controller, Get, Post, Query, Body, Logger, Param } from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateContentDto, CreateContentResponseDto } from './dto';

@Controller()
export class ContentController {
  private readonly logger = new Logger(ContentController.name);

  constructor(private readonly contentService: ContentService) {}

  @Get('all-content')
  async getAllContent(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('dialect') dialect?: string
  ) {
    this.logger.log(`GET /content/all - page: ${page}, perPage: ${perPage}, dialect: ${dialect}`);
    
    const pageNum = page ? parseInt(page, 10) : 1;
    const perPageNum = perPage ? parseInt(perPage, 10) : 10;
    const dialectStr = dialect || 'har';

    return await this.contentService.getAllContent(pageNum, perPageNum, dialectStr);
  }

  @Get('content-detail')
  async getContentDetail(
    @Query('slug') slug: string,
    @Query('dialect') dialect?: string
  ) {
    this.logger.log(`GET /content-detail - slug: ${slug}, dialect: ${dialect}`);
    
    if (!slug) {
      throw new Error('Slug parameter is required');
    }
    
    const dialectStr = dialect || 'har';
    
    return await this.contentService.getContentDetail(slug, dialectStr);
  }

  @Get('content/:content_id')
  async getContentByContentId(@Param('content_id') content_id: string) {
    this.logger.log(`GET /content/${content_id}`);
    
    if (!content_id) {
      throw new Error('Content ID parameter is required');
    }
    
    return await this.contentService.getContentByContentId(content_id);
  }

  @Get('content/slug/:slug')
  async getContentBySlug(@Param('slug') slug: string) {
    this.logger.log(`GET /content/slug/${slug}`);
    
    if (!slug) {
      throw new Error('Slug parameter is required');
    }
    
    return await this.contentService.getContentBySlug(slug);
  }

  @Post('create-content')
  async createContent(
    @Body() createContentDto: CreateContentDto
  ): Promise<CreateContentResponseDto> {
    this.logger.log(`POST /create-content - slug: ${createContentDto.slug}`);
    
    return await this.contentService.createContent(createContentDto.slug);
  }
}
