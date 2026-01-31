import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  const apiPrefix = process.env.API_PREFIX || 'api';
  const apiVersion = process.env.API_VERSION || 'v1';
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  // CORS
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('TrustCart Kenya API')
    .setDescription('E-commerce platform API for electronics in Kenya')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Health', 'Health check endpoints')
    .addTag('Products', 'Product catalog endpoints')
    .addTag('Categories', 'Product categories')
    .addTag('Cart', 'Shopping cart operations')
    .addTag('Orders', 'Order management')
    .addTag('Payments', 'Payment processing')
    .addTag('Auth', 'Authentication and authorization')
    .addTag('Admin', 'Admin operations')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start server
  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}/${apiVersion}`);
  logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
