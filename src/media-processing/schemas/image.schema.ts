import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Dimension } from '../../schemas/common/dimension.enum';

export type ImageDocument = Image & Document;

export enum ImageSource {
  VIDEO_UPLOAD = 'video_upload',
  TRAILER = 'trailer',
  IMAGE_UPLOAD = 'image_upload',
  ORIGINAL_CONTENT = 'original_content'
}

@Schema({ timestamps: true })
export class Image {
  @Prop({ 
    type: String, 
    required: true, 
    default: () => uuidv4(),
    unique: true 
  })
  images_id: string;

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
    required: true 
  })
  original_name: string;

  @Prop({ 
    type: String, 
    required: true,
    validate: {
      validator: function(v: string) {
        // Validate URL format (http/https, s3, or relative path)
        const urlPattern = /^(https?:\/\/|s3:\/\/|\/)/i;
        return urlPattern.test(v);
      },
      message: 'image_url must be a valid URL (http/https/s3) or relative path'
    }
  })
  image_url: string;

  @Prop({ 
    type: Date, 
    default: Date.now 
  })
  created_at: Date;

  @Prop({ 
    type: String, 
    required: true,
    enum: Object.values(ImageSource)
  })
  source: ImageSource;

  @Prop({ 
    type: String, 
    required: false,
    ref: 'Video'
  })
  video_id?: string;

  @Prop({ 
    type: String, 
    required: false,
    enum: Object.values(Dimension)
  })
  dimension?: Dimension;

  @Prop({ 
    type: String, 
    required: false,
    
  })
  timestamp?: number;


}

export const ImageSchema = SchemaFactory.createForClass(Image);

// Indexes for performance
ImageSchema.index({ images_id: 1 }, { unique: true });
ImageSchema.index({ content_id: 1 });
ImageSchema.index({ slug: 1 });
ImageSchema.index({ video_id: 1 });
ImageSchema.index({ source: 1 });
ImageSchema.index({ created_at: -1 }); 