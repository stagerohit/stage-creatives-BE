import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Dimension } from '../../schemas/common/dimension.enum';

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
    enum: Object.values(Dimension)
  })
  dimension?: Dimension;

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