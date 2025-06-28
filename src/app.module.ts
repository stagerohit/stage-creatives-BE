import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://stage_rohit:stage_rohit@localhost:27017/stage-creatives?authSource=admin', {
      retryWrites: true,
      retryReads: true,
      connectTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000,
    })
  ]
})
export class AppModule {}