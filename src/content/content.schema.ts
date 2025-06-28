import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type ContentDocument = Content & Document;

@Schema({ timestamps: true })
export class Content {
  @Prop({ 
    type: String, 
    required: true, 
    default: () => uuidv4(),
    unique: true 
  })
  content_id: string;

  @Prop({ 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  })
  slug: string;

  @Prop({ 
    type: String, 
    required: true 
  })
  title: string;

  @Prop({ 
    type: String, 
    required: true 
  })
  description: string;

  @Prop({ 
    type: String, 
    required: false 
  })
  genre?: string;

  @Prop({ 
    type: String, 
    required: false 
  })
  trailler_url?: string;

  @Prop({ 
    type: String, 
    required: false 
  })
  content_type: string;

  @Prop({ 
    type: Date, 
    default: Date.now 
  })
  created_at: Date;

  @Prop({ 
    type: String, 
    required: false
  })
  language: string;

  @Prop({ 
    type: String, 
    required: true 
  })
  dialect: string;
}

export const ContentSchema = SchemaFactory.createForClass(Content);

// Additional indexes for performance
ContentSchema.index({ slug: 1 }, { unique: true });
ContentSchema.index({ content_id: 1 }, { unique: true });
ContentSchema.index({ created_at: -1 }); // For sorting by creation date
