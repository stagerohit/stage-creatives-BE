import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const port = process.env.PORT || 3001;

  // Create application instance
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files for uploaded images with CORS headers
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res, path) => {
      // Add CORS headers for image access
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5185');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // Add cache control for images
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    },
  });

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enable CORS for frontend development
  app.enableCors({
    origin: ['http://localhost:5185', 'http://localhost:3000', 'http://localhost:5174'], // Common frontend dev ports
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200,
  });

  // Start listening
  await app.listen(port);
  console.log(`🚀 Application running on port ${port}`);
}

bootstrap().catch(err => {
  console.error('Application startup error:', err);
  process.exit(1);
});