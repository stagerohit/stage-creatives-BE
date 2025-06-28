import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Image, ImageDocument, ImageSource } from '../schemas/image.schema';
import { StorageService } from '../storage/storage.interface';
import { LocalStorageService } from '../storage/local-storage.service';
import { UploadImageDto, CreateScreenshotDto, ImageQueryDto } from '../dto';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly storageService: StorageService;

  constructor(
    @InjectModel(Image.name) private imageModel: Model<ImageDocument>,
    private localStorageService: LocalStorageService
  ) {
    // Use local storage by default - easily switchable to S3 later
    this.storageService = this.localStorageService;
  }

  async uploadImages(
    files: Express.Multer.File[],
    uploadImageDto: UploadImageDto
  ) {
    try {
      this.logger.log(`Uploading ${files.length} images for content: ${uploadImageDto.content_id}`);

      const uploadResults: Array<{
        images_id: string;
        original_name: string;
        image_url: string;
        filename: string;
      }> = [];

      for (const file of files) {
        // Validate file buffer exists
        if (!file.buffer) {
          throw new HttpException(
            `File ${file.originalname} has no data. Ensure multer memory storage is configured.`,
            HttpStatus.BAD_REQUEST
          );
        }

        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
          throw new HttpException(
            `File ${file.originalname} is not an image`,
            HttpStatus.BAD_REQUEST
          );
        }

        // Validate file size (100MB)
        if (file.size > 100 * 1024 * 1024) {
          throw new HttpException(
            `File ${file.originalname} exceeds 100MB limit`,
            HttpStatus.BAD_REQUEST
          );
        }

        // Generate unique filename
        const fileExtension = file.originalname.split('.').pop();
        const filename = `${uuidv4()}.${fileExtension}`;

        // Upload file using storage service
        const imageUrl = await this.storageService.upload(
          file.buffer,
          filename,
          file.mimetype
        );

        // Create image record in database
        const imageData = {
          content_id: uploadImageDto.content_id,
          slug: uploadImageDto.slug,
          original_name: uploadImageDto.original_name || file.originalname,
          image_url: imageUrl,
          source: uploadImageDto.source || ImageSource.IMAGE_UPLOAD,
          video_id: uploadImageDto.video_id,
          dimension: uploadImageDto.dimension
        };

        const newImage = new this.imageModel(imageData);
        const savedImage = await newImage.save();

        uploadResults.push({
          images_id: savedImage.images_id,
          original_name: savedImage.original_name,
          image_url: savedImage.image_url,
          filename: filename
        });

        this.logger.log(`Successfully uploaded image: ${savedImage.images_id}`);
      }

      return {
        message: `Successfully uploaded ${uploadResults.length} images`,
        images: uploadResults,
        count: uploadResults.length
      };

    } catch (error) {
      this.logger.error('Error uploading images:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while uploading images',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createScreenshot(createScreenshotDto: CreateScreenshotDto) {
    try {
      this.logger.log(`Creating screenshot for video: ${createScreenshotDto.video_id}`);

      // Validate video_id is provided for screenshots
      if (!createScreenshotDto.video_id) {
        throw new HttpException(
          'video_id is required for screenshot creation',
          HttpStatus.BAD_REQUEST
        );
      }

      const imageData = {
        content_id: createScreenshotDto.content_id,
        slug: createScreenshotDto.slug,
        original_name: createScreenshotDto.original_name,
        image_url: createScreenshotDto.image_url,
        source: ImageSource.VIDEO_UPLOAD,
        video_id: createScreenshotDto.video_id,
        dimension: createScreenshotDto.dimension,
        timestamp: createScreenshotDto.timestamp
      };

      const newImage = new this.imageModel(imageData);
      const savedImage = await newImage.save();

      this.logger.log(`Successfully created screenshot: ${savedImage.images_id}`);

      return {
        message: 'Screenshot created successfully',
        image: {
          images_id: savedImage.images_id,
          original_name: savedImage.original_name,
          image_url: savedImage.image_url,
          video_id: savedImage.video_id
        }
      };

    } catch (error) {
      this.logger.error('Error creating screenshot:', error);
      
      if (error.code === 11000) {
        throw new HttpException(
          'Screenshot with this ID already exists',
          HttpStatus.CONFLICT
        );
      }
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while creating screenshot',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getImages(queryDto: ImageQueryDto) {
    try {
      this.logger.log(`Getting images with filters:`, queryDto);

      // Build filter object
      const filter: any = {};
      
      if (queryDto.content_id) {
        filter.content_id = queryDto.content_id;
      }
      
      if (queryDto.video_id) {
        filter.video_id = queryDto.video_id;
      }
      
      if (queryDto.source) {
        filter.source = queryDto.source;
      }

      const images = await this.imageModel.find(filter).sort({ created_at: -1 });

      this.logger.log(`Found ${images.length} images`);

      return {
        images: images,
        count: images.length
      };

    } catch (error) {
      this.logger.error('Error getting images:', error);
      throw new HttpException(
        'Internal server error while getting images',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getImageById(imageId: string) {
    try {
      this.logger.log(`Getting image by ID: ${imageId}`);

      const image = await this.imageModel.findOne({ images_id: imageId });

      if (!image) {
        throw new HttpException(
          `Image not found with ID: ${imageId}`,
          HttpStatus.NOT_FOUND
        );
      }

      return image;

    } catch (error) {
      this.logger.error('Error getting image by ID:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while getting image',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteImage(imageId: string) {
    try {
      this.logger.log(`Deleting image: ${imageId}`);

      const image = await this.imageModel.findOne({ images_id: imageId });

      if (!image) {
        throw new HttpException(
          `Image not found with ID: ${imageId}`,
          HttpStatus.NOT_FOUND
        );
      }

      // Extract filename from URL for deletion
      const filename = image.image_url.split('/').pop();
      
      // Delete file from storage
      if (filename) {
        await this.storageService.delete(filename);
      }

      // Delete from database
      await this.imageModel.deleteOne({ images_id: imageId });

      this.logger.log(`Successfully deleted image: ${imageId}`);

      return {
        message: 'Image deleted successfully',
        images_id: imageId
      };

    } catch (error) {
      this.logger.error('Error deleting image:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Internal server error while deleting image',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 