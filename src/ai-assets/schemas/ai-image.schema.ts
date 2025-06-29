import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type AIImageDocument = AIImage & Document;

export enum Channel {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  YOUTUBE = 'youtube',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  TIKTOK = 'tiktok',
  WHATSAPP = 'whatsapp',
  CLEVERTAP = 'clevertap'
}

export enum UseCase {
  APP_THUMBNAIL = 'app_thumbnail',
  TITLE_MARKETING = 'title_marketing',
  SOCIAL_MEDIA_ORGANIC = 'social_media_organic',
  REENGAGEMENT = 'reengagement',
  PERFORMANCE_MARKETING = 'performance_marketing'
}

export enum AIDimension {
  DIMENSION_1920_1080 = '1920:1080',
  DIMENSION_1080_1920 = '1080:1920',
  DIMENSION_1024_1024 = '1024:1024',
  DIMENSION_1360_768 = '1360:768',
  DIMENSION_1080_1080 = '1080:1080',
  DIMENSION_1168_880 = '1168:880',
  DIMENSION_1440_1080 = '1440:1080',
  DIMENSION_1080_1440 = '1080:1440',
  DIMENSION_1808_768 = '1808:768',
  DIMENSION_2112_912 = '2112:912',
  DIMENSION_1280_720 = '1280:720',
  DIMENSION_720_1280 = '720:1280',
  DIMENSION_720_720 = '720:720',
  DIMENSION_960_720 = '960:720',
  DIMENSION_720_960 = '720:960',
  DIMENSION_1680_720 = '1680:720'
}

// New enum for source image types
export enum SourceImageType {
  IMAGE = 'image',           // From Images collection
  AI_IMAGE = 'ai_image'      // From AIImages collection
}

// Interface for source images with tags
export interface SourceImage {
  id: string;              // UUID from Images or AIImages collection
  type: SourceImageType;   // Specifies which collection to reference
  tag: string;             // Tag for Runway API @mention syntax
}

@Schema({ timestamps: true })
export class AIImage {
  @Prop({ 
    type: String, 
    required: true, 
    default: () => uuidv4(),
    unique: true 
  })
  ai_image_id: string;

  @Prop({ 
    type: String, 
    required: true,
    ref: 'Content'
  })
  content_id: string;

  @Prop({ 
    type: String, 
    required: true,
    ref: 'Content'
  })
  slug: string;

  @Prop({ 
    type: String, 
    required: false,
    enum: Object.values(Channel)
  })
  channel?: Channel;

  @Prop({ 
    type: String, 
    required: false,
    enum: Object.values(UseCase)
  })
  use_case?: UseCase;

  // UPDATED: Replace input_image_urls, image_ids, and ai_image_ids with source_images
  @Prop({ 
    type: [{
      id: { type: String, required: true },
      type: { type: String, required: true, enum: Object.values(SourceImageType) },
      tag: { type: String, required: true, minlength: 1, maxlength: 50 }
    }], 
    required: true,
    validate: {
      validator: function(v: SourceImage[]) {
        return v && v.length > 0;
      },
      message: 'At least one source image is required'
    }
  })
  source_images: SourceImage[]; // Array of source images with tags

  // Keep for backwards compatibility and reference URLs generated from source_images
  @Prop({ 
    type: [String], 
    required: false
  })
  input_image_urls?: string[]; // Generated URLs from source_images

  @Prop({ 
    type: String, 
    required: true,
    minlength: 1,
    maxlength: 2000
  })
  prompt: string;

  @Prop({ 
    type: String, 
    required: true,
    validate: {
      validator: function(v: string) {
        // Validate URL format (http/https, s3, or relative path)
        const urlPattern = /^(https?:\/\/|s3:\/\/|\/)/i;
        return urlPattern.test(v);
      },
      message: 'ai_image_url must be a valid URL (http/https/s3) or relative path'
    }
  })
  ai_image_url: string;

  @Prop({ 
    type: String, 
    required: true,
    enum: Object.values(AIDimension)
  })
  dimension?: AIDimension;

  @Prop({ 
    type: Date, 
    default: Date.now 
  })
  created_at: Date;
}

export const AIImageSchema = SchemaFactory.createForClass(AIImage);

// Indexes for performance
AIImageSchema.index({ ai_image_id: 1 }, { unique: true });
AIImageSchema.index({ content_id: 1 });
AIImageSchema.index({ slug: 1 });
AIImageSchema.index({ channel: 1 });
AIImageSchema.index({ use_case: 1 });
AIImageSchema.index({ created_at: -1 });
AIImageSchema.index({ 'source_images.id': 1 });
AIImageSchema.index({ 'source_images.type': 1 }); 