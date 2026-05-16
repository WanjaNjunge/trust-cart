import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { PrismaModule } from './modules/prisma';
import { ProductsModule } from './modules/products';
import { CategoriesModule } from './modules/categories';
import { BrandsModule } from './modules/brands';
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { CartModule } from './modules/cart';
import { OrdersModule } from './modules/orders';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications';
import { AdminModule } from './modules/admin/admin.module';
import { RedisModule } from './modules/redis';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // BullMQ for async job processing
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
    }),

    // Rate limiting — two tiers: general (20 req/60s) and strict (5 req/60s for auth)
    ThrottlerModule.forRoot([
      { name: 'general', ttl: 60000, limit: 20 },
      { name: 'strict', ttl: 60000, limit: 5 },
    ]),

    // Redis client (global — used by auth blacklist, reset tokens)
    RedisModule,

    // Database module
    PrismaModule,

    // Notifications module (async job processing)
    NotificationsModule,

    // Auth module
    AuthModule,

    // User module
    UsersModule,

    // Cart module
    CartModule,

    // Domain modules
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    OrdersModule,
    PaymentsModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    // Global rate limiter — applies ThrottlerModule tiers to every route
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule { }

