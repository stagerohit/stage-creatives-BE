import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Dimension } from '../../schemas/common/dimension.enum';

// Import existing enums from ai-assets
import { Channel, UseCase } from '../../ai-assets/schemas/ai-image.schema';

export enum PosterType {
  AI_GENERATED = 'ai_generated',
  HUMAN_UPLOADED = 'human_uploaded',
}

export type PosterDocument = Poster & Document;

@Schema({ collection: 'posters', timestamps: true })
export class Poster {
  @Prop({ 
    type: String, 
    default: uuidv4, 
    unique: true, 
    required: true 
  })
  poster_id: string;

  @Prop({ 
    type: String, 
    required: true 
  })
  content_id: string;

  @Prop({ 
    type: String, 
    required: true 
  })
  slug: string;

  @Prop({ 
    type: String, 
    enum: Object.values(Channel),
    required: false 
  })
  channel?: Channel;

  @Prop({ 
    type: String, 
    enum: Object.values(Dimension),
    required: false 
  })
  dimension?: Dimension;

  @Prop({ 
    type: [String], 
    default: [] 
  })
  ai_image_id: string[];

  @Prop({ 
    type: [String], 
    default: [] 
  })
  screenshot_ids: string[];

  @Prop({ 
    type: [String], 
    default: [] 
  })
  title_logo_id: string[];

  @Prop({ 
    type: [String], 
    default: [] 
  })
  copy_id: string[];

  @Prop({ 
    type: [String], 
    default: [] 
  })
  tagline_id: string[];

  @Prop({ 
    type: String, 
    enum: Object.values(UseCase),
    required: false 
  })
  use_case?: UseCase;

  @Prop({ 
    type: String, 
    enum: Object.values(PosterType),
    required: true 
  })
  poster_type: PosterType;

  @Prop({ 
    type: String, 
    required: true 
  })
  poster_url: string;

  @Prop({ 
    type: String, 
    required: true 
  })
  prompt_text: string;

  @Prop({ 
    type: Date, 
    default: Date.now 
  })
  created_at: Date;
}

export const PosterSchema = SchemaFactory.createForClass(Poster); 