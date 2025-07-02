import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';
import { spawn } from 'child_process';
import { Video, VideoDocument, VideoProcessingStatus } from '../schemas/video.schema';
import { Image, ImageDocument, ImageSource, ImageDimension } from '../schemas/image.schema';
import { UploadVideoDto, VideoQueryDto, TriggerScreenshotsDto } from '../dto';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly uploadsPath = path.join(process.cwd(), 'uploads', 'videos');
  private readonly imagesPath = path.join(process.cwd(), 'uploads', 'images');

  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    @InjectModel(Image.name) private imageModel: Model<ImageDocument>,
  ) {}

  /**
   * Upload video and trigger screenshot generation
   */
  async uploadVideo(
    file: Express.Multer.File,
    uploadVideoDto: UploadVideoDto
  ): Promise<{ message: string; video: any; screenshots: { status: string; count?: number } }> {
    try {
      // Validate file buffer exists
      if (!file.buffer) {
        throw new BadRequestException('Video file has no data. Ensure multer memory storage is configured.');
      }
      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const videoPath = path.join(this.uploadsPath, uniqueFilename);

      // Save video file
      await fs.writeFile(videoPath, file.buffer);
      this.logger.log(`Video saved: ${uniqueFilename}`);

      // Create video document
      const video = new this.videoModel({
        video_id: uuidv4(),
        content_id: uploadVideoDto.content_id,
        slug: uploadVideoDto.slug,
        original_name: file.originalname,
        video_url: `/uploads/videos/${uniqueFilename}`,
        file_size: file.size,
        duration: 0, // Will be updated by FFMPEG processing
        processing_status: VideoProcessingStatus.UPLOADING,
        screenshots_count: 0,
        timestamp: Date.now()
      });

      const savedVideo = await video.save();
      this.logger.log(`Video saved to database: ${savedVideo.video_id}`);

      // Update status to processing
      await this.videoModel.findByIdAndUpdate(savedVideo._id, {
        processing_status: VideoProcessingStatus.PROCESSING,
        timestamp: Date.now()
      });

      // Trigger screenshot generation in background
      const pulse = uploadVideoDto.pulse ? parseInt(uploadVideoDto.pulse) : 1000; // Default 1 minute
      this.generateScreenshotsBackground(savedVideo, videoPath, pulse);

      return {
        message: 'Video uploaded successfully',
        video: {
          video_id: savedVideo.video_id,
          original_name: savedVideo.original_name,
          video_url: savedVideo.video_url,
          processing_status: VideoProcessingStatus.PROCESSING
        },
        screenshots: { status: 'processing' }
      };

    } catch (error) {
      this.logger.error(`Error uploading video: ${error.message}`, error.stack);
      
      // Provide more specific error messages
      if (error.code === 11000) {
        throw new BadRequestException('Video with this ID already exists');
      }
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        throw new BadRequestException(`Validation failed: ${validationErrors.join(', ')}`);
      }
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to upload video: ${error.message}`);
    }
  }

  /**
   * Get video by ID
   */
  async getVideoById(videoId: string): Promise<VideoDocument> {
    const video = await this.videoModel.findOne({ video_id: videoId }).exec();
    if (!video) {
      throw new NotFoundException(`Video with ID ${videoId} not found`);
    }
    return video;
  }

  /**
   * Get videos with optional filters
   */
  async getVideos(queryDto: VideoQueryDto): Promise<{ videos: VideoDocument[]; count: number }> {
    const filter: any = {};
    
    if (queryDto.content_id) {
      filter.content_id = queryDto.content_id;
    }
    if (queryDto.processing_status) {
      filter.processing_status = queryDto.processing_status;
    }
    if (queryDto.slug) {
      filter.slug = queryDto.slug;
    }

    const videos = await this.videoModel
      .find(filter)
      .sort({ created_at: -1 })
      .exec();

    return {
      videos,
      count: videos.length
    };
  }

  /**
   * Get video upload status
   */
  async getVideoStatus(videoId: string): Promise<{
    video_id: string;
    processing_status: VideoProcessingStatus;
    screenshots_count: number;
    frame_rate?: number;
    resolution?: string;
    timestamp?: number;
  }> {
    const video = await this.getVideoById(videoId);
    
    return {
      video_id: video.video_id,
      processing_status: video.processing_status,
      screenshots_count: video.screenshots_count,
      frame_rate: video.frame_rate,
      resolution: video.resolution,
      timestamp: video.timestamp
    };
  }

  /**
   * Get all videos for a specific content ID
   */
  async getVideosByContentId(content_id: string): Promise<VideoDocument[]> {
    try {
      this.logger.log(`Fetching videos for content_id: ${content_id}`);

      const videos = await this.videoModel
        .find({ content_id })
        .sort({ created_at: -1 })
        .exec();

      this.logger.log(`Found ${videos.length} videos for content_id: ${content_id}`);
      return videos;

    } catch (error) {
      this.logger.error(`Error fetching videos by content_id: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to fetch videos for content: ${error.message}`);
    }
  }

  /**
   * Manually trigger screenshot generation
   */
  async triggerScreenshots(videoId: string, triggerDto: TriggerScreenshotsDto): Promise<{
    message: string;
    video_id: string;
    screenshots: { status: string };
  }> {
    const video = await this.getVideoById(videoId);
    const videoPath = path.join(this.uploadsPath, path.basename(video.video_url));
    
    // Check if video file exists
    try {
      await fs.access(videoPath);
    } catch (error) {
      throw new NotFoundException('Video file not found on disk');
    }

    // Update processing status
    await this.videoModel.findByIdAndUpdate(video._id, {
      processing_status: VideoProcessingStatus.PROCESSING,
      timestamp: Date.now()
    });

    const pulse = triggerDto.pulse ? parseInt(triggerDto.pulse) : 60000;
    this.generateScreenshotsBackground(video, videoPath, pulse);

    return {
      message: 'Screenshot generation triggered',
      video_id: videoId,
      screenshots: { status: 'processing' }
    };
  }

  /**
   * Background screenshot generation using FFMPEG
   */
  private generateScreenshotsBackground(video: VideoDocument, videoPath: string, pulse: number): void {
    this.logger.log(`Starting screenshot generation for video: ${video.video_id}, pulse: ${pulse}ms`);

    // First, get video metadata
    this.getVideoMetadata(videoPath)
      .then(async (metadata) => {
        // Update video with metadata
        await this.videoModel.findByIdAndUpdate(video._id, {
          duration: metadata.duration,
          frame_rate: metadata.frameRate,
          resolution: metadata.resolution,
          timestamp: Date.now()
        });

        // Generate screenshots
        return this.extractScreenshots(video, videoPath, pulse, metadata.duration);
      })
      .then(async (screenshotCount) => {
        // Update video as completed
        await this.videoModel.findByIdAndUpdate(video._id, {
          processing_status: VideoProcessingStatus.COMPLETED,
          screenshots_count: screenshotCount,
          timestamp: Date.now()
        });

        this.logger.log(`Screenshot generation completed for video: ${video.video_id}, generated: ${screenshotCount} screenshots`);
      })
      .catch(async (error) => {
        this.logger.error(`Screenshot generation failed for video: ${video.video_id}`, error.stack);
        
        // Update video as failed
        await this.videoModel.findByIdAndUpdate(video._id, {
          processing_status: VideoProcessingStatus.FAILED,
          timestamp: Date.now()
        });
      });
  }

  /**
   * Get video metadata using FFMPEG
   */
  private getVideoMetadata(videoPath: string): Promise<{
    duration: number;
    frameRate: number;
    resolution: string;
  }> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        videoPath
      ]);

      let output = '';
      
      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        this.logger.error(`FFPROBE stderr: ${data}`);
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`FFPROBE process exited with code ${code}`));
          return;
        }

        try {
          const metadata = JSON.parse(output);
          const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
          
          if (!videoStream) {
            reject(new Error('No video stream found'));
            return;
          }

          const duration = parseFloat(metadata.format.duration) || 0;
          const frameRate = eval(videoStream.r_frame_rate) || 30; // Evaluate fraction like "30000/1001"
          const resolution = `${videoStream.width}x${videoStream.height}`;

          resolve({
            duration: Math.round(duration * 1000), // Convert to milliseconds
            frameRate: Math.round(frameRate),
            resolution
          });
        } catch (error) {
          reject(new Error(`Failed to parse FFPROBE output: ${error.message}`));
        }
      });
    });
  }

  /**
   * Extract screenshots using FFMPEG
   */
  private extractScreenshots(
    video: VideoDocument, 
    videoPath: string, 
    pulse: number, 
    durationMs: number
  ): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const screenshots: string[] = [];
        const pulseSeconds = pulse / 1000;
        const durationSeconds = durationMs / 1000;
        
        // Calculate screenshot timestamps
        const timestamps: number[] = [];
        for (let time = 0; time < durationSeconds; time += pulseSeconds) {
          timestamps.push(time);
        }

        if (timestamps.length === 0) {
          resolve(0);
          return;
        }

        this.logger.log(`Extracting ${timestamps.length} screenshots for video: ${video.video_id}`);

        // Extract screenshots sequentially to avoid overwhelming the system
        for (let i = 0; i < timestamps.length; i++) {
          const timestamp = timestamps[i];
          const screenshotFilename = `${uuidv4()}.jpg`;
          const screenshotPath = path.join(this.imagesPath, screenshotFilename);

          try {
            await this.extractSingleScreenshot(videoPath, timestamp, screenshotPath);
            
            // Save screenshot to Images collection
            const image = new this.imageModel({
              images_id: uuidv4(),
              content_id: video.content_id,
              slug: video.slug,
              original_name: `screenshot_${Math.round(timestamp)}s.jpg`,
              image_url: `/uploads/images/${screenshotFilename}`,
              source: ImageSource.VIDEO_UPLOAD,
              video_id: video.video_id,
              dimension: this.detectDimension(video.resolution)
            });

            await image.save();
            screenshots.push(screenshotFilename);
            
            this.logger.log(`Screenshot ${i + 1}/${timestamps.length} saved: ${screenshotFilename}`);
          } catch (error) {
            this.logger.warn(`Failed to extract screenshot at ${timestamp}s: ${error.message}`);
            // Continue with next screenshot - partial success is allowed
          }
        }

        resolve(screenshots.length);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Extract single screenshot using FFMPEG
   */
  private extractSingleScreenshot(videoPath: string, timestamp: number, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-ss', timestamp.toString(),
        '-vframes', '1',
        '-q:v', '2', // Higher quality
        '-y', // Overwrite output file
        outputPath
      ]);

      ffmpeg.stderr.on('data', (data) => {
        // FFMPEG outputs to stderr by default, don't log unless there's an error
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFMPEG process exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Auto-detect dimension based on resolution  
   */
  private detectDimension(resolution?: string): ImageDimension {
    if (!resolution) return ImageDimension.LANDSCAPE_16_9;

    const [width, height] = resolution.split('x').map(Number);
    if (!width || !height) return ImageDimension.LANDSCAPE_16_9;

    const aspectRatio = width / height;
    
    // Map common aspect ratios to dimensions
    if (Math.abs(aspectRatio - 16/9) < 0.1) return ImageDimension.LANDSCAPE_16_9;
    if (Math.abs(aspectRatio - 4/3) < 0.1) return ImageDimension.STANDARD_4_3;
    if (Math.abs(aspectRatio - 1) < 0.1) return ImageDimension.SQUARE;
    if (Math.abs(aspectRatio - 9/16) < 0.1) return ImageDimension.VERTICAL_9_16;
    if (Math.abs(aspectRatio - 3/4) < 0.1) return ImageDimension.PORTRAIT_3_4;
    if (Math.abs(aspectRatio - 21/9) < 0.1) return ImageDimension.CINEMA_21_9;
    
    // Default to 16:9 if no close match
    return ImageDimension.LANDSCAPE_16_9;
  }

  /**
   * Delete video and associated screenshots
   */
  async deleteVideo(videoId: string): Promise<{ message: string }> {
    const video = await this.getVideoById(videoId);
    
    try {
      // Delete video file
      const videoPath = path.join(this.uploadsPath, path.basename(video.video_url));
      await fs.unlink(videoPath).catch(() => {}); // Ignore if file doesn't exist

      // Delete associated screenshots
      const screenshots = await this.imageModel.find({ video_id: videoId }).exec();
      for (const screenshot of screenshots) {
        const imagePath = path.join(this.imagesPath, path.basename(screenshot.image_url));
        await fs.unlink(imagePath).catch(() => {}); // Ignore if file doesn't exist
      }

      // Delete from database
      await this.imageModel.deleteMany({ video_id: videoId }).exec();
      await this.videoModel.findByIdAndDelete(video._id).exec();

      this.logger.log(`Video and screenshots deleted: ${videoId}`);
      
      return { message: 'Video and associated screenshots deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting video: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete video');
    }
  }
} 