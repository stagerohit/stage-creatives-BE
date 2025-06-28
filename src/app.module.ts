import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentModule } from './content/content.module';
import { MediaProcessingModule } from './media-processing/media-processing.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://stage_rohit:stage_rohit@localhost:27017/stage-creatives?authSource=admin', {
      retryWrites: true,
      retryReads: true,
      connectTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000,
    }),
    ContentModule,
    MediaProcessingModule
  ]
})
export class AppModule {}