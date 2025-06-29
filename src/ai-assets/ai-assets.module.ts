import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIImage, AIImageSchema } from './schemas/ai-image.schema';
import { TitleLogo, TitleLogoSchema } from './schemas/title-logo.schema';
import { Tagline, TaglineSchema } from './schemas/tagline.schema';
import { Copy, CopySchema } from './schemas/copy.schema';
import { Image, ImageSchema } from '../media-processing/schemas/image.schema';
import { Content, ContentSchema } from '../content/content.schema';
import { AIImageController } from './controllers/ai-image.controller';
import { TitleLogoController } from './controllers/title-logo.controller';
import { TaglineController } from './controllers/tagline.controller';
import { CopyController } from './controllers/copy.controller';
import { AIImageService } from './services/ai-image.service';
import { TitleLogoService } from './services/title-logo.service';
import { TaglineService } from './services/tagline.service';
import { CopyService } from './services/copy.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AIImage.name, schema: AIImageSchema },
      { name: TitleLogo.name, schema: TitleLogoSchema },
      { name: Tagline.name, schema: TaglineSchema },
      { name: Copy.name, schema: CopySchema },
      { name: Image.name, schema: ImageSchema },
      { name: Content.name, schema: ContentSchema },
    ]),
  ],
  controllers: [AIImageController, TitleLogoController, TaglineController, CopyController],
  providers: [AIImageService, TitleLogoService, TaglineService, CopyService],
  exports: [AIImageService, TitleLogoService, TaglineService, CopyService]
})
export class AiAssetsModule {} 