import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIImage, AIImageSchema } from './schemas/ai-image.schema';
import { TitleLogo, TitleLogoSchema } from './schemas/title-logo.schema';
import { Image, ImageSchema } from '../media-processing/schemas/image.schema';
import { Content, ContentSchema } from '../content/content.schema';
import { AIImageController } from './controllers/ai-image.controller';
import { TitleLogoController } from './controllers/title-logo.controller';
import { AIImageService } from './services/ai-image.service';
import { TitleLogoService } from './services/title-logo.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AIImage.name, schema: AIImageSchema },
      { name: TitleLogo.name, schema: TitleLogoSchema },
      { name: Image.name, schema: ImageSchema },
      { name: Content.name, schema: ContentSchema },
    ]),
  ],
  controllers: [AIImageController, TitleLogoController],
  providers: [AIImageService, TitleLogoService],
  exports: [AIImageService, TitleLogoService]
})
export class AiAssetsModule {} 