import { 
  Controller, 
  Get, 
  Post, 
  Delete,
  Param, 
  Body, 
  Query,
  UseInterceptors, 
  UploadedFiles,
  Logger 
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { ImageService } from '../services/image.service';
import { UploadImageDto, CreateScreenshotDto, ImageQueryDto } from '../dto';

@Controller('images')
export class ImageController {
  private readonly logger = new Logger(ImageController.name);

  constructor(private readonly imageService: ImageService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('images', 10, {
    storage: multer.memoryStorage(), // Use memory storage to access file.buffer
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB per file
      files: 10, // Maximum 10 files
    },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.startsWith('image/')) {
        return callback(new Error('Only image files are allowed'), false);
      }
      callback(null, true);
    },
  }))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadImageDto: UploadImageDto
  ) {
    this.logger.log(`POST /images/upload - content_id: ${uploadImageDto.content_id}, files: ${files?.length || 0}`);
    
    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }
    
    return await this.imageService.uploadImages(files, uploadImageDto);
  }

  @Post('screenshots')
  async createScreenshot(
    @Body() createScreenshotDto: CreateScreenshotDto
  ) {
    this.logger.log(`POST /images/screenshots - video_id: ${createScreenshotDto.video_id}`);
    
    return await this.imageService.createScreenshot(createScreenshotDto);
  }

  @Get()
  async getImages(
    @Query() queryDto: ImageQueryDto
  ) {
    this.logger.log(`GET /images - filters:`, queryDto);
    
    return await this.imageService.getImages(queryDto);
  }

  @Get(':image_id')
  async getImageById(
    @Param('image_id') imageId: string
  ) {
    this.logger.log(`GET /images/:image_id - imageId: ${imageId}`);
    
    return await this.imageService.getImageById(imageId);
  }

  @Delete(':image_id')
  async deleteImage(
    @Param('image_id') imageId: string
  ) {
    this.logger.log(`DELETE /images/:image_id - imageId: ${imageId}`);
    
    return await this.imageService.deleteImage(imageId);
  }
} 