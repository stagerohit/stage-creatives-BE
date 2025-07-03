import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { RunwayML } from '@runwayml/sdk';

import { Poster, PosterDocument, PosterType } from '../schemas/poster.schema';
import { Content, ContentDocument } from '../../content/content.schema';
import { AIImage, AIImageDocument, ReferenceImage } from '../../ai-assets/schemas/ai-image.schema';
import { Image, ImageDocument } from '../../media-processing/schemas/image.schema';
import { TitleLogo, TitleLogoDocument } from '../../ai-assets/schemas/title-logo.schema';
import { Copy, CopyDocument } from '../../ai-assets/schemas/copy.schema';
import { Tagline, TaglineDocument } from '../../ai-assets/schemas/tagline.schema';
import { CreatePosterDto, UploadPosterDto, PosterQueryDto } from '../dto';

/**
 * Poster Service for AI generation and manual upload
 * 
 * Handles both AI-generated posters via Runway API and human-uploaded posters
 */
@Injectable()
export class PosterService {
  private readonly runwayClient: RunwayML;
  private readonly baseUrl =   'https://c521-14-195-110-75.ngrok-free.app'; // ngrok URL
  private readonly useMockMode = true; // Set to true for testing without Runway API

  constructor(
    @InjectModel(Poster.name) private posterModel: Model<PosterDocument>,
    @InjectModel(Content.name) private contentModel: Model<ContentDocument>,
    @InjectModel(AIImage.name) private aiImageModel: Model<AIImageDocument>,
    @InjectModel(Image.name) private imageModel: Model<ImageDocument>,
    @InjectModel(TitleLogo.name) private titleLogoModel: Model<TitleLogoDocument>,
    @InjectModel(Copy.name) private copyModel: Model<CopyDocument>,
    @InjectModel(Tagline.name) private taglineModel: Model<TaglineDocument>,
  ) {
    // Initialize Runway client
    this.runwayClient = new RunwayML({
      apiKey: 'key_qMYAXNGNvSGLHDEqTY2WKQM7JWlCLDqiGLTGcTH0RKA',
    });

    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    const uploadDir = path.join(process.cwd(), 'uploads', 'posters');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('📁 Created posters upload directory:', uploadDir);
    }
  }

  async generatePoster(createPosterDto: CreatePosterDto): Promise<Poster> {
    console.log('🎯 Poster Service - generatePoster called');
    const { content_id, slug, dimension, use_case, channel } = createPosterDto;
    console.log('📊 Input params:', createPosterDto);

    try {
      console.log('🔍 Step 1: Validating content and assets...');
      // Step 1: Validate content exists
      const content = await this.validateContent(content_id);
      
      // Step 2: Validate at least one asset array is provided
      this.validateAssetArrays(createPosterDto);
      
      console.log('🖼️ Step 2: Collecting asset URLs...');
      // Step 3: Collect all asset URLs and build reference images
      const referenceImages = await this.buildReferenceImages(createPosterDto);
      console.log('✅ Reference images built:', referenceImages.length);
      
      console.log('📝 Step 3: Building prompt text...');
      // Step 4: Build prompt text from content title, tagline, and use case
      const promptText = await this.buildPromptText(content, createPosterDto);
      console.log('✅ Prompt text:', promptText);
      
      console.log('🤖 Step 4: Calling Runway API...');
      // Step 5: Call Runway API to generate poster
      const generatedImageUrl = await this.callRunwayAPI(promptText, dimension, referenceImages);
      console.log('✅ Runway API response received');
      
      console.log('💾 Step 5: Downloading and saving poster...');
      // Step 6: Download and save the generated poster
      const posterPath = await this.downloadAndSavePoster(generatedImageUrl);
      console.log('✅ Poster saved to:', posterPath);
      
      console.log('📝 Step 6: Creating database record...');
      // Step 7: Create poster record in database
      const poster = new this.posterModel({
        poster_id: uuidv4(),
        content_id,
        slug,
        channel,
        dimension,
        ai_image_id: createPosterDto.ai_image_id || [],
        screenshot_ids: createPosterDto.screenshot_ids || [],
        title_logo_id: createPosterDto.title_logo_id || [],
        copy_id: createPosterDto.copy_id || [],
        tagline_id: createPosterDto.tagline_id || [],
        use_case,
        poster_type: PosterType.AI_GENERATED,
        poster_url: posterPath,
        prompt_text: promptText,
      });

      const savedRecord = await poster.save();
      console.log('✅ Poster record saved with ID:', savedRecord.poster_id);
      return savedRecord;
    } catch (error) {
      console.error('❌ Error in generatePoster service:', error.message);
      console.error('🔍 Full error:', error);
      throw new HttpException(
        error.message || 'Failed to generate poster',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async uploadPoster(uploadPosterDto: UploadPosterDto, file: Express.Multer.File): Promise<Poster> {
    console.log('🎯 Poster Service - uploadPoster called');
    const { content_id, slug, use_case, channel, dimension } = uploadPosterDto;
    console.log('📊 Input params:', uploadPosterDto);
    console.log('📎 File info:', { originalname: file.originalname, size: file.size, mimetype: file.mimetype });

    try {
      console.log('🔍 Step 1: Validating content...');
      // Step 1: Validate content exists and get content data
      const content = await this.validateContent(content_id);
      
      console.log('💾 Step 2: Saving uploaded file...');
      // Step 2: Save uploaded file
      const posterPath = await this.saveUploadedFile(file);
      console.log('✅ File saved to:', posterPath);
      
      console.log('📝 Step 3: Creating database record...');
      // Step 3: Create poster record in database
      const poster = new this.posterModel({
        poster_id: uuidv4(),
        content_id,
        slug,
        channel,
        dimension,
        ai_image_id: uploadPosterDto.ai_image_id || [],
        screenshot_ids: uploadPosterDto.screenshot_ids || [],
        title_logo_id: uploadPosterDto.title_logo_id || [],
        copy_id: uploadPosterDto.copy_id || [],
        tagline_id: uploadPosterDto.tagline_id || [],
        use_case,
        poster_type: PosterType.HUMAN_UPLOADED,
        poster_url: posterPath,
        prompt_text: `Human uploaded poster for ${content.title || 'content'}`,
      });

      const savedRecord = await poster.save();
      console.log('✅ Poster record saved with ID:', savedRecord.poster_id);
      return savedRecord;
    } catch (error) {
      console.error('❌ Error in uploadPoster service:', error.message);
      console.error('🔍 Full error:', error);
      throw new HttpException(
        error.message || 'Failed to upload poster',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async validateContent(content_id: string): Promise<any> {
    const content = await this.contentModel.findOne({ content_id }).exec();
    if (!content) {
      throw new HttpException(`Content with ID ${content_id} not found`, HttpStatus.NOT_FOUND);
    }
    return content;
  }

  private validateAssetArrays(dto: CreatePosterDto): void {
    const hasAssets = [
      dto.ai_image_id && dto.ai_image_id.length > 0,
      dto.screenshot_ids && dto.screenshot_ids.length > 0,
      dto.title_logo_id && dto.title_logo_id.length > 0,
      dto.copy_id && dto.copy_id.length > 0,
      dto.tagline_id && dto.tagline_id.length > 0
    ].some(Boolean);

    if (!hasAssets) {
      throw new HttpException(
        'At least one asset ID array must be provided and non-empty',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  private async buildReferenceImages(dto: CreatePosterDto): Promise<ReferenceImage[]> {
    const referenceImages: ReferenceImage[] = [];
    let tagCounter = 1;

    // Collect AI Image URLs
    if (dto.ai_image_id && dto.ai_image_id.length > 0) {
      const aiImages = await this.aiImageModel.find({ 
        ai_image_id: { $in: dto.ai_image_id } 
      }).exec();
      
      for (const aiImage of aiImages) {
        referenceImages.push({
          url: this.convertToAbsoluteUrl(aiImage.ai_image_url),
          tag: `aiimage${tagCounter++}`
        });
      }
    }

    // Collect Screenshot URLs
    if (dto.screenshot_ids && dto.screenshot_ids.length > 0) {
      const images = await this.imageModel.find({ 
        image_id: { $in: dto.screenshot_ids } 
      }).exec();
      
      for (const image of images) {
        referenceImages.push({
          url: this.convertToAbsoluteUrl(image.image_url),
          tag: `image${tagCounter++}`
        });
      }
    }

    // Collect Title Logo URLs
    if (dto.title_logo_id && dto.title_logo_id.length > 0) {
      const titleLogos = await this.titleLogoModel.find({ 
        title_logo_id: { $in: dto.title_logo_id } 
      }).exec();
      
      for (const titleLogo of titleLogos) {
        referenceImages.push({
          url: this.convertToAbsoluteUrl(titleLogo.title_logo_url),
          tag: `titlelogo${tagCounter++}`
        });
      }
    }

    return referenceImages;
  }

  private async buildPromptText(content: any, dto: CreatePosterDto): Promise<string> {
    let promptParts: string[] = [];
    
    // Add content title
    if (content.title) {
      promptParts.push(content.title);
    }
    
    // Add tagline text if tagline_id is provided
    if (dto.tagline_id && dto.tagline_id.length > 0) {
      const taglines = await this.taglineModel.find({ 
        tagline_id: { $in: dto.tagline_id } 
      }).exec();
      
      for (const tagline of taglines) {
        if (tagline.text) {
          promptParts.push(tagline.text);
        }
      }
    }
    
    // Add use case if provided
    if (dto.use_case) {
      promptParts.push(`Use case: ${dto.use_case}`);
    }
    
    // Ensure we always have some prompt text
    if (promptParts.length === 0) {
      promptParts.push('Generate a creative poster');
    }
    
    return promptParts.join('. ');
  }

  private convertToAbsoluteUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `${this.baseUrl}${url}`;
    }
    return `${this.baseUrl}/${url}`;
  }

  private async callRunwayAPI(
    promptText: string, 
    dimension: string, 
    referenceImages: ReferenceImage[]
  ): Promise<string> {
    // Mock mode for testing without Runway API
    if (this.useMockMode) {
      console.log('🧪 MOCK MODE: Simulating Runway API call');
      console.log('📝 Would send to Runway:', {
        model: 'gen4_image',
        ratio: dimension,
        promptText: promptText,
        referenceImages: referenceImages.map(ref => ({ uri: ref.url, tag: ref.tag }))
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return a mock image URL
      return 'https://picsum.photos/1920/1080?random=' + Date.now();
    }

    try {
      console.log('🤖 Calling Runway API with params:', {
        promptText,
        dimension,
        referenceImagesCount: referenceImages.length
      });

      const task = await this.runwayClient.textToImage
        .create({
          model: 'gen4_image',
          ratio: dimension as any,
          promptText: promptText,
          referenceImages: referenceImages.map(ref => ({ uri: ref.url, tag: ref.tag })),
        })
        .waitForTaskOutput();

      console.log('✅ Runway task completed:', task.id);
      
      if (task.output && task.output.length > 0) {
        const output = task.output[0] as any;
        return typeof output === 'string' ? output : (output.url || output);
      } else {
        throw new Error('No output generated by Runway API');
      }
    } catch (error) {
      console.error('❌ Runway API call failed:', error);
      throw new HttpException(
        `Runway API failed: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async downloadAndSavePoster(imageUrl: string): Promise<string> {
    try {
      const response = await axios.get(imageUrl, { responseType: 'stream' });
      const filename = `${uuidv4()}.png`;
      const filepath = path.join(process.cwd(), 'uploads', 'posters', filename);
      
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(`/uploads/posters/${filename}`));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('❌ Failed to download poster:', error);
      throw new HttpException('Failed to download generated poster', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async saveUploadedFile(file: Express.Multer.File): Promise<string> {
    const filename = `${uuidv4()}.${file.originalname.split('.').pop()}`;
    const filepath = path.join(process.cwd(), 'uploads', 'posters', filename);
    
    fs.writeFileSync(filepath, file.buffer);
    return `/uploads/posters/${filename}`;
  }

  // Query methods
  async getPosterById(poster_id: string): Promise<Poster> {
    const poster = await this.posterModel.findOne({ poster_id }).exec();
    if (!poster) {
      throw new HttpException('Poster not found', HttpStatus.NOT_FOUND);
    }
    return poster;
  }

  async getPostersByContentId(content_id: string): Promise<Poster[]> {
    return await this.posterModel.find({ content_id }).exec();
  }

  async getPostersByChannel(channel: string): Promise<Poster[]> {
    return await this.posterModel.find({ channel }).exec();
  }

  async getPostersByUseCase(use_case: string): Promise<Poster[]> {
    return await this.posterModel.find({ use_case }).exec();
  }

  async getPostersByType(poster_type: PosterType): Promise<Poster[]> {
    return await this.posterModel.find({ poster_type }).exec();
  }

  async getAllPosters(query: PosterQueryDto): Promise<{
    data: Poster[];
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
    if (filters.dimension) filterObj.dimension = filters.dimension;
    if (filters.use_case) filterObj.use_case = filters.use_case;
    if (filters.poster_type) filterObj.poster_type = filters.poster_type;
    if (filters.prompt_text) filterObj.prompt_text = new RegExp(filters.prompt_text, 'i');

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortObj: any = { [sort]: order === 'desc' ? -1 : 1 };

    // Execute queries
    const [data, total] = await Promise.all([
      this.posterModel.find(filterObj).sort(sortObj).skip(skip).limit(limit).exec(),
      this.posterModel.countDocuments(filterObj).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }
} 