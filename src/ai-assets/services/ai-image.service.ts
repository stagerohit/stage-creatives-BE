import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import RunwayML, { TaskFailedError } from '@runwayml/sdk';

import { AIImage, AIImageDocument, ReferenceImage } from '../schemas/ai-image.schema';
import { Image, ImageDocument } from '../../media-processing/schemas/image.schema';
import { CreateAIImageDto, CreateAIImageRunwayDto, AIImageQueryDto } from '../dto';

/**
 * AI Image Service for Runway API integration
 * 
 * IMPORTANT: Update the baseUrl property when:
 * 1. Setting up ngrok for local testing (replace 'your-ngrok-url' with actual ngrok URL)
 * 2. Switching to S3 or cloud storage for production
 */
@Injectable()
export class AIImageService {
  private readonly runwayClient: RunwayML;
  private readonly uploadsPath = path.join(process.cwd(), 'uploads', 'ai-images');
  
  // TODO: Update this URL when switching to S3
  private readonly baseUrl = 'https://c521-14-195-110-75.ngrok-free.app';
  
  // Temporary flag for testing without ngrok
  private readonly useMockMode = false; // Set to true for mock mode, false for real Runway API

  constructor(
    @InjectModel(AIImage.name) private aiImageModel: Model<AIImageDocument>,
    @InjectModel(Image.name) private imageModel: Model<ImageDocument>,
  ) {
    this.runwayClient = new RunwayML({
      apiKey: 'key_891e85fa8bc94b72ac775c180709d92ab0d2a15a6b66683a77bdd67bcffe8eefbfed9fb026fdf2c28dea2a4465e5b2f55702b142022bbbb4aed536ec1defadc2',
    });

    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsPath)) {
      fs.mkdirSync(this.uploadsPath, { recursive: true });
    }
  }

  /**
   * Map Runway ratio format to our AIDimension enum value
   */
  private mapRatioToDimension(ratio: string): string {
    // The enum values are the ratio strings themselves, not the enum keys
    const validRatios = [
      '1920:1080', '1080:1920', '1024:1024', '1360:768', '1080:1080',
      '1168:880', '1440:1080', '1080:1440', '1808:768', '2112:912',
      '1280:720', '720:1280', '720:720', '960:720', '720:960', '1680:720'
    ];

    if (validRatios.includes(ratio)) {
      return ratio; // Return the ratio as-is since enum values are the ratio strings
    }

    // Default to 1920:1080 if ratio not found
    console.warn(`⚠️ Unknown ratio: ${ratio}, defaulting to 1920:1080`);
    return '1920:1080';
  }

  async generateWithRunway(createAIImageRunwayDto: CreateAIImageRunwayDto): Promise<AIImage> {
    console.log('🎯 AI Image Service - generateWithRunway called');
    const { content_id, slug, ratio, promptText, referenceImages, channel, use_case } = createAIImageRunwayDto;
    console.log('📊 Input params:', { content_id, slug, ratio, promptText, referenceImages, channel, use_case });

    // Validate reference images (max 3)
    if (referenceImages.length > 3) {
      throw new HttpException('Maximum 3 reference images allowed', HttpStatus.BAD_REQUEST);
    }

    try {
      console.log('🔍 Step 1: Validating and converting reference image URLs...');
      // Step 1: Validate that all reference image URLs are accessible and convert localhost URLs
      const convertedReferenceImages = await this.validateReferenceImageUrls(referenceImages);
      console.log('✅ All reference images are accessible and converted');

      console.log('🤖 Step 2: Calling Runway API...');
      // Step 2: Generate AI image using Runway API with converted reference images
      const generatedImageUrl = await this.callRunwayAPIWithDirectReferences(promptText, ratio, convertedReferenceImages);
      console.log('✅ Runway API response received:', generatedImageUrl);

      console.log('💾 Step 3: Downloading and saving image...');
      // Step 3: Download and save the generated image
      const savedImagePath = await this.downloadAndSaveImage(generatedImageUrl);
      console.log('✅ Image saved to:', savedImagePath);

      console.log('📝 Step 4: Creating database record...');
      // Step 4: Map ratio to dimension and create AIImage record
      const mappedDimension = this.mapRatioToDimension(ratio);
      
              const aiImage = new this.aiImageModel({
          ai_image_id: uuidv4(),
          content_id,
          slug,
          channel,
          use_case,
          input_image_urls: convertedReferenceImages.map(ref => ref.uri), // Use converted reference image URLs to satisfy validation
          image_ids: [], // Not used since we're using direct URIs
          ai_image_ids: [], // Not used since we're using direct URIs
          reference_images: convertedReferenceImages.map(ref => ({ url: ref.uri, tag: ref.tag })),
          prompt: promptText,
          ai_image_url: savedImagePath,
          dimension: mappedDimension,
        });

      const savedRecord = await aiImage.save();
      console.log('✅ AI Image record saved with ID:', savedRecord.ai_image_id);
      return savedRecord;
    } catch (error) {
      console.error('❌ Error in generateWithRunway service:', error.message);
      console.error('🔍 Full error:', error);
      throw new HttpException(
        error.message || 'Failed to generate AI image',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check if a URL is a localhost URL
   */
  private isLocalhostUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname === 'localhost' || 
             parsedUrl.hostname === '127.0.0.1' || 
             parsedUrl.hostname.endsWith('.local');
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert localhost URL to ngrok URL
   */
  private convertLocalhostToNgrok(url: string): string {
    if (!this.isLocalhostUrl(url)) {
      return url; // Return as-is if not localhost
    }

    try {
      const parsedUrl = new URL(url);
      // Replace the origin (protocol + hostname + port) with ngrok URL
      const ngrokUrl = url.replace(parsedUrl.origin, this.baseUrl);
      console.log(`🔄 Converting localhost URL: ${url} → ${ngrokUrl}`);
      return ngrokUrl;
    } catch (error) {
      console.error('❌ Failed to convert localhost URL:', error.message);
      return url; // Return original if conversion fails
    }
  }

  /**
   * Validate that reference image URLs are accessible (with localhost conversion)
   */
  private async validateReferenceImageUrls(referenceImages: Array<{ uri: string; tag: string }>): Promise<Array<{ uri: string; tag: string }>> {
    console.log('🔍 Validating and converting reference image URLs...');
    
    const convertedReferenceImages: Array<{ uri: string; tag: string }> = [];
    
    for (const refImage of referenceImages) {
      // Convert localhost URLs to ngrok URLs
      const convertedUri = this.convertLocalhostToNgrok(refImage.uri);
      
      try {
        const response = await axios.head(convertedUri);
        console.log(`✅ Image accessible: ${convertedUri} (Status: ${response.status})`);
        
        // Add the converted URL to the result
        convertedReferenceImages.push({
          uri: convertedUri,
          tag: refImage.tag
        });
      } catch (error) {
        console.error(`❌ Image NOT accessible: ${convertedUri}`, error.message);
        throw new HttpException(
          `Reference image not accessible: ${convertedUri}. Make sure the URL is valid and accessible.`,
          HttpStatus.BAD_REQUEST
        );
      }
    }
    
    return convertedReferenceImages;
  }

  /**
   * Call Runway API with direct reference images (no database lookup needed)
   */
  private async callRunwayAPIWithDirectReferences(
    promptText: string, 
    ratio: string, 
    referenceImages: Array<{ uri: string; tag: string }>
  ): Promise<string> {
    console.log('🚀 Calling Runway API with direct references:');
    console.log('   Prompt:', promptText);
    console.log('   Ratio:', ratio);
    console.log('   Reference Images:', referenceImages);

    // Mock mode for testing without Runway API
    if (this.useMockMode) {
      console.log('🧪 MOCK MODE: Simulating Runway API call');
      console.log('📝 Would send to Runway:', {
        model: 'gen4_image',
        ratio: ratio,
        promptText: promptText,
        referenceImages: referenceImages.map(ref => ({ uri: ref.uri, tag: ref.tag }))
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return a mock image URL
      return 'https://picsum.photos/1920/1080?random=' + Date.now();
    }

    // Real Runway API call
    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        console.log(`Calling Runway API (attempt ${attempt + 1}/${maxRetries + 1})`);
        
        const task = await this.runwayClient.textToImage
          .create({
            model: 'gen4_image',
            ratio: ratio as any,
            promptText: promptText,
            referenceImages: referenceImages.map(ref => ({
              uri: ref.uri,
              tag: ref.tag,
            })),
          })
          .waitForTaskOutput();

        console.log('Runway API task completed:', task);
        
        if (task.output && task.output.length > 0) {
          return task.output[0];
        } else {
          throw new Error('No output received from Runway API');
        }
      } catch (error) {
        attempt++;
        console.error(`Runway API attempt ${attempt} failed:`, error);
        
        // Check if error is a TaskFailedError (safer check)
        if (error && typeof error === 'object' && 'taskDetails' in error) {
          console.error('Task details:', error.taskDetails);
        }
        
        if (attempt > maxRetries) {
          throw new HttpException(
            `Runway API failed after ${maxRetries + 1} attempts: ${error.message}`,
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new HttpException('Runway API failed after all retry attempts', HttpStatus.SERVICE_UNAVAILABLE);
  }

  private async buildReferenceImages(image_ids?: string[], ai_image_ids?: string[]): Promise<ReferenceImage[]> {
    const referenceImages: ReferenceImage[] = [];
    let tagCounter = 1;

    // Fetch URLs from Images collection
    if (image_ids && image_ids.length > 0) {
      const images = await this.imageModel.find({ images_id: { $in: image_ids } });
      
      for (const imageId of image_ids) {
        const image = images.find(img => img.images_id === imageId);
        if (!image) {
          throw new HttpException(`Image with ID ${imageId} not found`, HttpStatus.NOT_FOUND);
        }
        
        // Convert relative URL to absolute URL for Runway API
        const imageUrl = image.image_url.startsWith('http') 
          ? image.image_url 
          : `${this.baseUrl}${image.image_url}`;
          
        referenceImages.push({
          url: imageUrl,
          tag: `image${tagCounter++}`,
        });
      }
    }

    // Fetch URLs from AIImages collection
    if (ai_image_ids && ai_image_ids.length > 0) {
      const aiImages = await this.aiImageModel.find({ ai_image_id: { $in: ai_image_ids } });
      
      for (const aiImageId of ai_image_ids) {
        const aiImage = aiImages.find(img => img.ai_image_id === aiImageId);
        if (!aiImage) {
          throw new HttpException(`AI Image with ID ${aiImageId} not found`, HttpStatus.NOT_FOUND);
        }
        
        // Convert relative URL to absolute URL for Runway API
        const aiImageUrl = aiImage.ai_image_url.startsWith('http') 
          ? aiImage.ai_image_url 
          : `${this.baseUrl}${aiImage.ai_image_url}`;
          
        referenceImages.push({
          url: aiImageUrl,
          tag: `aiimage${tagCounter++}`,
        });
      }
    }

    // Validate maximum 3 reference images
    if (referenceImages.length > 3) {
      throw new HttpException('Maximum 3 reference images allowed', HttpStatus.BAD_REQUEST);
    }

    return referenceImages;
  }

  private async callRunwayAPI(prompt: string, dimension: string, referenceImages: ReferenceImage[]): Promise<string> {
    console.log('🚀 Calling Runway API with:');
    console.log('   Prompt:', prompt);
    console.log('   Dimension:', dimension);
    console.log('   Reference Images:', referenceImages);

    // Test if reference image URLs are accessible
    for (const refImage of referenceImages) {
      try {
        const response = await axios.head(refImage.url);
        console.log(`✅ Image accessible: ${refImage.url} (Status: ${response.status})`);
      } catch (error) {
        console.error(`❌ Image NOT accessible: ${refImage.url}`, error.message);
        throw new HttpException(
          `Reference image not accessible: ${refImage.url}. Make sure ngrok is running and images are served correctly.`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Mock mode for testing without ngrok
    if (this.useMockMode) {
      console.log('🧪 MOCK MODE: Simulating Runway API call');
      console.log('📝 Would send to Runway:', {
        model: 'gen4_image',
        ratio: dimension,
        promptText: prompt,
        referenceImages: referenceImages.map(ref => ({ uri: ref.url, tag: ref.tag }))
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return a mock image URL
      return 'https://picsum.photos/1920/1080?random=' + Date.now();
    }

    // Real Runway API call with HTTPS URLs (works with ngrok)
    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        console.log(`Calling Runway API (attempt ${attempt + 1}/${maxRetries + 1})`);
        
        const task = await this.runwayClient.textToImage
          .create({
            model: 'gen4_image',
            ratio: dimension as any,
            promptText: prompt,
            referenceImages: referenceImages.map(ref => ({
              uri: ref.url,
              tag: ref.tag,
            })),
          })
          .waitForTaskOutput();

        console.log('Runway API task completed:', task);
        
        if (task.output && task.output.length > 0) {
          return task.output[0];
        } else {
          throw new Error('No output received from Runway API');
        }
      } catch (error) {
        attempt++;
        console.error(`Runway API attempt ${attempt} failed:`, error);
        
        // Check if error is a TaskFailedError (safer check)
        if (error && typeof error === 'object' && 'taskDetails' in error) {
          console.error('Task details:', error.taskDetails);
        }
        
        if (attempt > maxRetries) {
          throw new HttpException(
            `Runway API failed after ${maxRetries + 1} attempts: ${error.message}`,
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new HttpException('Runway API failed after all retry attempts', HttpStatus.SERVICE_UNAVAILABLE);
  }

  private async downloadAndSaveImage(imageUrl: string): Promise<string> {
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);
      
      // Generate unique filename
      const filename = `${uuidv4()}.jpg`;
      const filePath = path.join(this.uploadsPath, filename);
      
      // Save image to uploads folder
      fs.writeFileSync(filePath, imageBuffer);
      
      // Return relative path for database storage
      return `/uploads/ai-images/${filename}`;
    } catch (error) {
      console.error('Error downloading image:', error);
      throw new HttpException('Failed to download and save generated image', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAIImageById(ai_image_id: string): Promise<AIImage> {
    const aiImage = await this.aiImageModel.findOne({ ai_image_id }).exec();
    if (!aiImage) {
      throw new HttpException('AI Image not found', HttpStatus.NOT_FOUND);
    }
    return aiImage;
  }

  async getAllAIImages(query: AIImageQueryDto): Promise<{
    data: AIImage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc', ...filters } = query;
    
    // Build filter object
    const filterObj: any = {};
    if (filters.content_id) filterObj.content_id = filters.content_id;
    if (filters.slug) filterObj.slug = new RegExp(filters.slug, 'i');
    if (filters.channel) filterObj.channel = filters.channel;
    if (filters.use_case) filterObj.use_case = filters.use_case;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortObj: any = { [sort]: order === 'desc' ? -1 : 1 };

    // Execute queries
    const [data, total] = await Promise.all([
      this.aiImageModel.find(filterObj).sort(sortObj).skip(skip).limit(limit).exec(),
      this.aiImageModel.countDocuments(filterObj).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getAIImagesByImageId(image_id: string): Promise<AIImage[]> {
    return await this.aiImageModel.find({ image_ids: image_id }).exec();
  }

  async getAIImagesByAIImageId(ai_image_id: string): Promise<AIImage[]> {
    return await this.aiImageModel.find({ ai_image_ids: ai_image_id }).exec();
  }

  async getAIImagesByContentId(content_id: string): Promise<AIImage[]> {
    try {
      console.log(`🔍 Fetching AI images for content_id: ${content_id}`);
      
      const aiImages = await this.aiImageModel.find({ content_id }).exec();
      
      console.log(`✅ Found ${aiImages.length} AI images for content_id: ${content_id}`);
      return aiImages;
    } catch (error) {
      console.error('❌ Error fetching AI images by content_id:', error);
      throw new HttpException(
        'Failed to fetch AI images by content_id',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 