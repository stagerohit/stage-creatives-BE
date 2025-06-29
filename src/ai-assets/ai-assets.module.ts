import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIImage, AIImageSchema } from './schemas/ai-image.schema';
import { Image, ImageSchema } from '../media-processing/schemas/image.schema';
import { AIImageController } from './controllers/ai-image.controller';
import { AIImageService } from './services/ai-image.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AIImage.name, schema: AIImageSchema },
      { name: Image.name, schema: ImageSchema },
    ]),
  ],
  controllers: [AIImageController],
  providers: [AIImageService],
  exports: [AIImageService]
})
export class AiAssetsModule {} 