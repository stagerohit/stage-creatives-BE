import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type ImageDocument = Image & Document;

export enum ImageSource {
  VIDEO_UPLOAD = 'video_upload',
  TRAILER = 'trailer',
  IMAGE_UPLOAD = 'image_upload',
  ORIGINAL_CONTENT = 'original_content'
}

export enum ImageDimension {
  SQUARE = '1:1',
  PORTRAIT_4_5 = '4:5',
  VERTICAL_9_16 = '9:16',
  LANDSCAPE_16_9 = '16:9',
  PORTRAIT_2_3 = '2:3',
  PORTRAIT_3_4 = '3:4',
  LANDSCAPE_5_4 = '5:4',
  LANDSCAPE_3_2 = '3:2',
  ULTRA_WIDE_2_1 = '2:1',
  VERTICAL_1_2 = '1:2',
  STANDARD_4_3 = '4:3',
  ULTRA_WIDE_3_1 = '3:1',
  VERTICAL_1_3 = '1:3',
  CINEMA_21_9 = '21:9',
  CINEMA_21_10 = '21:10',
  LANDSCAPE_5_2 = '5:2',
  LANDSCAPE_7_5 = '7:5',
  LANDSCAPE_8_5 = '8:5',
  LANDSCAPE_10_3 = '10:3',
  LANDSCAPE_11_4 = '11:4'
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
    enum: Object.values(ImageDimension)
  })
  dimension?: ImageDimension;

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