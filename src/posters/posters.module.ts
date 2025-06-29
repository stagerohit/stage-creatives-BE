import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';

import { PosterController } from './controllers/poster.controller';
import { PosterService } from './services/poster.service';
import { Poster, PosterSchema } from './schemas/poster.schema';

// Import related schemas for dependencies
import { Content, ContentSchema } from '../content/content.schema';
import { AIImage, AIImageSchema } from '../ai-assets/schemas/ai-image.schema';
import { Image, ImageSchema } from '../media-processing/schemas/image.schema';
import { TitleLogo, TitleLogoSchema } from '../ai-assets/schemas/title-logo.schema';
import { Copy, CopySchema } from '../ai-assets/schemas/copy.schema';
import { Tagline, TaglineSchema } from '../ai-assets/schemas/tagline.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Poster.name, schema: PosterSchema },
      { name: Content.name, schema: ContentSchema },
      { name: AIImage.name, schema: AIImageSchema },
      { name: Image.name, schema: ImageSchema },
      { name: TitleLogo.name, schema: TitleLogoSchema },
      { name: Copy.name, schema: CopySchema },
      { name: Tagline.name, schema: TaglineSchema },
    ]),
    MulterModule.register({
      dest: './uploads/posters',
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [PosterController],
  providers: [PosterService],
  exports: [PosterService],
})
export class PostersModule {} 