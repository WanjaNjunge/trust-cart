import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters';

// Known-weak dev placeholder — must never reach non-development environments (FIND-036)
const INSECURE_JWT_SECRETS = new Set([
  'trustcart-dev-secret-key-change-in-production',
  'CHANGE_ME_IN_PRODUCTION_use_a_long_random_string',
  'secret',
  'jwt_secret',
  'changeme',
]);

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  // Startup validation — fail fast on missing or insecure configuration (FIND-036, FIND-037)
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set');
  }
  if (!isProduction && !isTest) {
    // development — weak secrets allowed locally
  } else if (isProduction) {
    if (INSECURE_JWT_SECRETS.has(jwtSecret) || jwtSecret.length < 32) {
      throw new Error(
        'FATAL: JWT_SECRET is a known-weak placeholder. Generate a strong secret before deploying.',
      );
    }
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('FATAL: DATABASE_URL environment variable is not set');
  }
  // Enforce encrypted connections in production (FIND-026 partial — see docs/security/database-tls.md)
  if (isProduction && !databaseUrl.includes('sslmode=require')) {
    throw new Error(
      'FATAL: DATABASE_URL must include sslmode=require in production. See docs/security/database-tls.md',
    );
  }

  if (!process.env.REDIS_HOST) {
    throw new Error('FATAL: REDIS_HOST environment variable is not set');
  }

  const app = await NestFactory.create(AppModule);

  // Global prefix
  const apiPrefix = process.env.API_PREFIX || 'api';
  const apiVersion = process.env.API_VERSION || 'v1';
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  // Global exception filter — consistent error shape, no stack trace leakage in prod (FIND-021)
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Cookie parser — required for HttpOnly JWT cookie extraction (FIND-016)
  app.use(cookieParser());

  // Security headers — applied before CORS and routes (FIND-006)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // allow Swagger UI assets in dev
    }),
  );

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

  // Swagger — disabled in production (FIND-007)
  if (process.env.NODE_ENV !== 'production') {
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
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`Swagger docs available at: http://localhost:${process.env.PORT || 3001}/api/docs`);
  }

  // Start server
  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}/${apiVersion}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
