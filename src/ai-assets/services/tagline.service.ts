import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenAI } from '@google/genai';

import { Tagline, TaglineDocument } from '../schemas/tagline.schema';
import { Content, ContentDocument } from '../../content/content.schema';
import { CreateTaglineDto } from '../dto/create-tagline.dto';

/**
 * Tagline Service for Gemini Imagen API integration
 * 
 * Generates tagline images using Google's Gemini Imagen model
 */
@Injectable()
export class TaglineService {
  private readonly genAI: GoogleGenAI;
  private readonly uploadsPath = path.join(process.cwd(), 'uploads', 'taglines');

  constructor(
    @InjectModel(Tagline.name) private taglineModel: Model<TaglineDocument>,
    @InjectModel(Content.name) private contentModel: Model<ContentDocument>,
  ) {
    // Initialize Google GenAI with API key
    this.genAI = new GoogleGenAI({
      apiKey: 'AIzaSyBVbV_ytZH2kH2BizetHb7gl2SFJymGVE0'
    });

    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsPath)) {
      fs.mkdirSync(this.uploadsPath, { recursive: true });
    }
  }

  async generateTagline(createTaglineDto: CreateTaglineDto): Promise<Tagline> {
    console.log('🎯 Tagline Service - generateTagline called');
    const { content_id, slug, text, tagline_prompt, channel, dimension } = createTaglineDto;
    console.log('📊 Input params:', { content_id, slug, text, tagline_prompt, channel, dimension });

    try {
      console.log('🔍 Step 1: Validating content...');
      // Step 1: Validate content_id exists
      await this.validateContent(content_id);
      console.log('✅ Content validated');
      
      console.log('🎨 Step 2: Generating tagline image with Gemini Imagen...');
      // Step 2: Generate image using Gemini Imagen API
      const generatedImagePath = await this.callGeminiImagenAPI(text, tagline_prompt, dimension);
      console.log('✅ Image generated and saved:', generatedImagePath);
      
      console.log('📝 Step 3: Creating database record...');
      // Step 3: Create Tagline record in database
      const tagline = new this.taglineModel({
        tagline_id: uuidv4(),
        content_id,
        slug,
        text,
        tagline_prompt,
        tagline_url: generatedImagePath,
        channel,
        dimension,
      });

      const savedRecord = await tagline.save();
      console.log('✅ Tagline record saved with ID:', savedRecord.tagline_id);
      return savedRecord;
    } catch (error) {
      console.error('❌ Error in generateTagline service:', error.message);
      console.error('🔍 Full error:', error);
      throw new HttpException(
        error.message || 'Failed to generate tagline',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async validateContent(content_id: string): Promise<void> {
    const content = await this.contentModel.findOne({ content_id }).exec();
    if (!content) {
      throw new HttpException(`Content with ID ${content_id} not found`, HttpStatus.NOT_FOUND);
    }
  }

  private async callGeminiImagenAPI(text: string, tagline_prompt: string, dimension?: string): Promise<string> {
    try {
      console.log('🤖 Calling Gemini Imagen API...');
      
      // Build the final prompt
      const finalPrompt = `Create a tagline image with text: "${text}".${tagline_prompt}, Write the tagline text in english on a transparent background, in a cinematic style, capturign the theme of the movie. `;
      console.log('📝 Final prompt:', finalPrompt);

      // Determine aspect ratio for config
      const aspectRatio = this.getAspectRatioConfig(dimension);
      console.log('📐 Aspect ratio config:', aspectRatio);

      // Call Gemini Imagen API
      const response = await this.genAI.models.generateImages({
        model: 'imagen-4.0-generate-preview-06-06',
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: aspectRatio,
        },
      });

      console.log('✅ Gemini API response received');
      
      if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error('No images generated by Gemini API');
      }

      // Process the first generated image
      const generatedImage = response.generatedImages[0];
      
      if (!generatedImage.image || !generatedImage.image.imageBytes) {
        throw new Error('No image bytes received from Gemini API');
      }
      
      const imageBytes = generatedImage.image.imageBytes;

      // Save the image
      const savedPath = await this.saveImageFromBase64(imageBytes);
      console.log('✅ Image saved successfully:', savedPath);
      
      return savedPath;
    } catch (error) {
      console.error('❌ Gemini API call failed:', error);
      throw new HttpException(
        `Gemini API failed: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private getAspectRatioConfig(dimension?: string): string {
    // Map our dimension enums to Gemini's aspect ratio format
    switch (dimension) {
      case '1:1':
        return '1:1';
      case '16:9':
        return '16:9';
      case '9:16':
        return '9:16';
      case '21:9':
        return '16:9'; // Fallback to 16:9 for cinema
      case '4:5':
        return '4:5';
      default:
        return '16:9'; // Default to landscape
    }
  }

  private async saveImageFromBase64(base64Data: string): Promise<string> {
    try {
      // Decode base64 to buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Generate unique filename
      const filename = `${uuidv4()}.png`;
      const filePath = path.join(this.uploadsPath, filename);
      
      // Save image to uploads folder
      fs.writeFileSync(filePath, imageBuffer);
      
      // Return relative path for database storage
      return `/uploads/taglines/${filename}`;
    } catch (error) {
      console.error('Error saving image from base64:', error);
      throw new HttpException('Failed to save generated image', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getTaglineById(tagline_id: string): Promise<Tagline> {
    const tagline = await this.taglineModel.findOne({ tagline_id }).exec();
    if (!tagline) {
      throw new HttpException('Tagline not found', HttpStatus.NOT_FOUND);
    }
    return tagline;
  }

  async getTaglinesByContentId(content_id: string): Promise<Tagline[]> {
    return await this.taglineModel.find({ content_id }).exec();
  }

  async getAllTaglines(query: any): Promise<{
    data: Tagline[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc', ...filters } = query;
    
    // Build filter object
    const filterObj: any = {};
    if (filters.content_id) filterObj.content_id = filters.content_id;
    if (filters.slug) filterObj.slug = new RegExp(filters.slug, 'i');
    if (filters.text) filterObj.text = new RegExp(filters.text, 'i');
    if (filters.channel) filterObj.channel = filters.channel;
    if (filters.dimension) filterObj.dimension = filters.dimension;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortObj: any = { [sort]: order === 'desc' ? -1 : 1 };

    // Execute queries
    const [data, total] = await Promise.all([
      this.taglineModel.find(filterObj).sort(sortObj).skip(skip).limit(limit).exec(),
      this.taglineModel.countDocuments(filterObj).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }
} 