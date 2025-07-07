import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Dimension } from '../../schemas/common/dimension.enum';
import { Channel } from '../../schemas/common/channel.enum';

@Schema({ timestamps: true })
export class TitleLogo {
  @Prop({ required: true, unique: true })
  title_logo_id: string;

  @Prop({ required: true })
  content_id: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  title_logo_url: string;

  @Prop({ enum: Channel, required: false })
  channel?: Channel;

  @Prop({ required: true })
  title_prompt: string;

  @Prop({ required: true })
  title: string;

  @Prop({ enum: Dimension, required: false })
  dimension: Dimension;

  @Prop({ default: Date.now })
  created_at: Date;
}

export type TitleLogoDocument = TitleLogo & Document;
export const TitleLogoSchema = SchemaFactory.createForClass(TitleLogo); 