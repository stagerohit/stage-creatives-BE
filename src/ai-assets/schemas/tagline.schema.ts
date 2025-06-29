import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Enum for supported channels
export enum Channel {
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  TWITTER = 'TWITTER',
  YOUTUBE = 'YOUTUBE',
  LINKEDIN = 'LINKEDIN',
  TIKTOK = 'TIKTOK',
  PINTEREST = 'PINTEREST',
}

// Enum for supported dimensions/aspect ratios
export enum Dimension {
  SQUARE = '1:1',           // Square format
  LANDSCAPE = '16:9',       // Landscape/widescreen
  PORTRAIT = '9:16',        // Portrait/vertical
  CINEMA = '21:9',          // Cinema/ultrawide
  STORY = '9:16',           // Story format (same as portrait)
  POST = '4:5',             // Social media post format
}

@Schema({ timestamps: true })
export class Tagline {
  @Prop({ required: true, unique: true })
  tagline_id: string;

  @Prop({ required: true })
  content_id: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  tagline_prompt: string;

  @Prop({ required: true })
  tagline_url: string;

  @Prop({ enum: Channel, required: false })
  channel?: Channel;

  @Prop({ enum: Dimension, required: false })
  dimension?: Dimension;

  @Prop({ default: Date.now })
  created_at: Date;
}

export type TaglineDocument = Tagline & Document;
export const TaglineSchema = SchemaFactory.createForClass(Tagline); 