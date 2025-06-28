import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';

// Schemas
import { Video, VideoSchema } from './schemas/video.schema';
import { Image, ImageSchema } from './schemas/image.schema';

// Controllers
import { ImageController } from './controllers/image.controller';
import { VideoController } from './controllers/video.controller';

// Services
import { ImageService } from './services/image.service';
import { VideoService } from './services/video.service';
import { LocalStorageService } from './storage/local-storage.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Video.name, schema: VideoSchema },
      { name: Image.name, schema: ImageSchema }
    ]),
    MulterModule.register({
      dest: './uploads/images',
    })
  ],
  controllers: [ImageController, VideoController],
  providers: [
    ImageService,
    VideoService,
    LocalStorageService
  ],
  exports: [
    ImageService,
    VideoService,
    LocalStorageService
  ]
})
export class MediaProcessingModule {} 