import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { PrismaModule } from './modules/prisma';
import { ProductsModule } from './modules/products';
import { CategoriesModule } from './modules/categories';
import { BrandsModule } from './modules/brands';
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { CartModule } from './modules/cart';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database module
    PrismaModule,

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
    // OrdersModule,    // TODO: Phase 8.4
    // PaymentsModule,  // TODO: Phase 8.5 (high-risk, requires approval)
    // AdminModule,     // TODO: Phase 8.6
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
