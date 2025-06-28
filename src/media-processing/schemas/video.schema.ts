import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type VideoDocument = Video & Document;

export enum VideoProcessingStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing', 
  COMPLETED = 'completed',
  FAILED = 'failed'
}

@Schema({ timestamps: true })
export class Video {
  @Prop({ 
    type: String, 
    required: true, 
    default: () => uuidv4(),
    unique: true 
  })
  video_id: string;

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
      message: 'video_url must be a valid URL (http/https/s3) or relative path'
    }
  })
  video_url: string;

  @Prop({ 
    type: Date, 
    default: Date.now 
  })
  created_at: Date;

  @Prop({ 
    type: Number, 
    required: false,
    min: 0,
    default: 0
  })
  duration: number; // in milliseconds

  @Prop({ 
    type: Number, 
    required: true,
    min: 0
  })
  file_size: number; // in bytes

  @Prop({ 
    type: String, 
    required: true,
    enum: Object.values(VideoProcessingStatus),
    default: VideoProcessingStatus.UPLOADING
  })
  processing_status: VideoProcessingStatus;

  @Prop({ 
    type: Number, 
    required: false,
    min: 0
  })
  frame_rate?: number; // frames per second

  @Prop({ 
    type: String, 
    required: false
  })
  resolution?: string; // e.g., "1920x1080"

  @Prop({ 
    type: Number, 
    required: false,
    min: 0,
    default: 0
  })
  screenshots_count: number;

  @Prop({ 
    type: Number, 
    required: false
  })
  timestamp?: number; // processing timestamp in milliseconds
}

export const VideoSchema = SchemaFactory.createForClass(Video);

// Indexes for performance
VideoSchema.index({ video_id: 1 }, { unique: true });
VideoSchema.index({ content_id: 1 });
VideoSchema.index({ slug: 1 });
VideoSchema.index({ processing_status: 1 });
VideoSchema.index({ created_at: -1 }); 