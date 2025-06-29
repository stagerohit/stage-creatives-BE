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

@Schema({ timestamps: true })
export class Copy {
  @Prop({ required: true, unique: true })
  copy_id: string;

  // Content ID that the copy is associated with from Content collection
  @Prop({ required: true })
  content_id: string;

  // Slug that the copy is associated with from Content collection
  @Prop({ required: true })
  slug: string;

  // Input text that will be used to generate the copy
  @Prop({ required: true })
  text: string;

  // AI-generated copy text output
  @Prop({ required: true })
  copy: string;

  // Optional styling prompt for copy generation
  @Prop({ required: false })
  copy_prompt?: string;

  // Optional channel enum for targeting specific platforms
  @Prop({ enum: Channel, required: false })
  channel?: Channel;

  @Prop({ default: Date.now })
  created_at: Date;
}

export type CopyDocument = Copy & Document;
export const CopySchema = SchemaFactory.createForClass(Copy); 