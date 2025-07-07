import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Dimension } from '../../schemas/common/dimension.enum';
import { Channel } from '../../schemas/common/channel.enum';

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