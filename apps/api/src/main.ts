import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
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

    // Start server
    const port = process.env.PORT || 3001;
    await app.listen(port);

    logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}/${apiVersion}`);
    logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
