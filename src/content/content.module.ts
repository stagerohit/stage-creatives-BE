import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { Content, ContentSchema } from './content.schema';

// Import all related schemas
import { Image, ImageSchema } from '../media-processing/schemas/image.schema';
import { Poster, PosterSchema } from '../posters/schemas/poster.schema';
import { TitleLogo, TitleLogoSchema } from '../ai-assets/schemas/title-logo.schema';
import { Tagline, TaglineSchema } from '../ai-assets/schemas/tagline.schema';
import { Copy, CopySchema } from '../ai-assets/schemas/copy.schema';
import { AIImage, AIImageSchema } from '../ai-assets/schemas/ai-image.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Content.name, schema: ContentSchema },
      { name: Image.name, schema: ImageSchema },
      { name: Poster.name, schema: PosterSchema },
      { name: TitleLogo.name, schema: TitleLogoSchema },
      { name: Tagline.name, schema: TaglineSchema },
      { name: Copy.name, schema: CopySchema },
      { name: AIImage.name, schema: AIImageSchema },
    ]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
