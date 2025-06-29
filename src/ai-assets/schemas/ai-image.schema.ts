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

// Interface for reference images with URL and tag
export interface ReferenceImage {
  url: string;
  tag: string;
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

  @Prop({ 
    type: [String], 
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v && v.length > 0;
      },
      message: 'At least one image ID is required'
    }
  })
  input_image_urls: string[]; // Array of URLs

  @Prop({ 
    type: [String], 
    required: false,
    ref: 'Images'
  })
  image_ids?: string[]; // Array of image IDs from Images collection

  @Prop({ 
    type: [String], 
    required: false,
    ref: 'AIImage'
  })
  ai_image_ids?: string[]; // Array of image IDs from AIImages collection

  // New field for Runway API reference images with tags
  @Prop({ 
    type: [{
      url: { type: String, required: true },
      tag: { type: String, required: true, minlength: 1, maxlength: 50 }
    }], 
    required: false,
    validate: {
      validator: function(v: ReferenceImage[]) {
        return !v || v.length <= 3;
      },
      message: 'Maximum 3 reference images allowed'
    }
  })
  reference_images: ReferenceImage[]; // Array of {url, tag} objects, max 3

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
AIImageSchema.index({ 'reference_images.tag': 1 }); 