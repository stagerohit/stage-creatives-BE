import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    Query,
    Body,
    UploadedFile,
    UseInterceptors,
    HttpStatus,
    HttpException,
    Logger,
  } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { VideoService } from '../services/video.service';
  import { UploadVideoDto, VideoQueryDto, TriggerScreenshotsDto } from '../dto';
  
  @Controller('videos')
  export class VideoController {
    private readonly logger = new Logger(VideoController.name);
  
    constructor(private readonly videoService: VideoService) {}
  
    /**
     * Upload video and trigger automatic screenshot generation
     * POST /videos/upload
     */
      @Post('upload')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: multer.memoryStorage(), // Use memory storage to access file.buffer
      limits: {
        fileSize: 1024 * 1024 * 1024, // 1GB limit
      },
      fileFilter: (req, file, callback) => {
        // Strictly video formats
        if (!file.mimetype.startsWith('video/')) {
          return callback(
            new HttpException(
              'Only video files are allowed',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
    async uploadVideo(
      @UploadedFile() file: Express.Multer.File,
      @Body() uploadVideoDto: UploadVideoDto,
    ) {
      try {
        if (!file) {
          throw new HttpException('Video file is required', HttpStatus.BAD_REQUEST);
        }
  
        this.logger.log(`Uploading video: ${file.originalname}, size: ${file.size} bytes`);
        
        const result = await this.videoService.uploadVideo(file, uploadVideoDto);
        
        return {
          statusCode: HttpStatus.CREATED,
          message: result.message,
          data: {
            video: result.video,
            screenshots: result.screenshots,
          },
        };
      } catch (error) {
        this.logger.error(`Video upload failed: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    /**
     * Get specific video by ID
     * GET /videos/:video_id
     */
    @Get(':video_id')
    async getVideoById(@Param('video_id') videoId: string) {
      try {
        const video = await this.videoService.getVideoById(videoId);
        
        return {
          statusCode: HttpStatus.OK,
          message: 'Video retrieved successfully',
          data: video,
        };
      } catch (error) {
        this.logger.error(`Get video failed: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    /**
     * Get videos with optional filters
     * GET /videos?content_id=X&processing_status=completed
     */
    @Get()
    async getVideos(@Query() queryDto: VideoQueryDto) {
      try {
        const result = await this.videoService.getVideos(queryDto);
        
        return {
          statusCode: HttpStatus.OK,
          message: 'Videos retrieved successfully',
          data: {
            videos: result.videos,
            count: result.count,
            filters: queryDto,
          },
        };
      } catch (error) {
        this.logger.error(`Get videos failed: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    /**
     * Get video upload and processing status
     * GET /videos/:video_id/status
     */
    @Get(':video_id/status')
    async getVideoStatus(@Param('video_id') videoId: string) {
      try {
        const status = await this.videoService.getVideoStatus(videoId);
        
        return {
          statusCode: HttpStatus.OK,
          message: 'Video status retrieved successfully',
          data: status,
        };
      } catch (error) {
        this.logger.error(`Get video status failed: ${error.message}`, error.stack);
        throw error;
      }
    }
  
    /**
     * Manually trigger screenshot generation
     * POST /videos/:video_id/screenshots
     */
    @Post(':video_id/screenshots')
    async triggerScreenshots(
      @Param('video_id') videoId: string,
      @Body() triggerDto: TriggerScreenshotsDto,
    ) {
      try {
        const result = await this.videoService.triggerScreenshots(videoId, triggerDto);
        
        return {
          statusCode: HttpStatus.ACCEPTED,
          message: result.message,
          data: {
            video_id: result.video_id,
            screenshots: result.screenshots,
          },
        };
      } catch (error) {
        this.logger.error(`Trigger screenshots failed: ${error.message}`, error.stack);
        throw error;
      }
    }
  
      /**
   * Get all videos for a specific content
   * GET /videos/content/:content_id
   */
  @Get('content/:content_id')
  async getVideosByContentId(@Param('content_id') content_id: string) {
    try {
      this.logger.log(`GET /videos/content/${content_id}`);
      
      const videos = await this.videoService.getVideosByContentId(content_id);
      
      return {
        statusCode: HttpStatus.OK,
        message: 'Videos retrieved successfully',
        data: {
          content_id: content_id,
          videos: videos,
          count: videos.length,
        },
      };
    } catch (error) {
      this.logger.error(`Get videos by content ID failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete video and associated screenshots
   * DELETE /videos/:video_id
   */
  @Delete(':video_id')
  async deleteVideo(@Param('video_id') videoId: string) {
    try {
      const result = await this.videoService.deleteVideo(videoId);
      
      return {
        statusCode: HttpStatus.OK,
        message: result.message,
        data: {
          video_id: videoId,
          deleted: true,
        },
      };
    } catch (error) {
      this.logger.error(`Delete video failed: ${error.message}`, error.stack);
      throw error;
    }
  }
  }