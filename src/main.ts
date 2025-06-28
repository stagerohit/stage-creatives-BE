import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const port = process.env.PORT || 3001;

  // Create application instance
  const app = await NestFactory.create(AppModule);

  // Enable CORS (adjust as needed)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Start listening
  await app.listen(port);
  console.log(`🚀 Application running on port ${port}`);
}

bootstrap().catch(err => {
  console.error('Application startup error:', err);
  process.exit(1);
});