import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),

        // Database module will be added here
        // DatabaseModule,

        // Domain modules will be added here
        // UserModule,
        // ProductModule,
        // InventoryModule,
        // CartModule,
        // OrderModule,
        // PaymentModule,
        // DeliveryModule,
        // PromotionModule,
        // ReviewModule,
    ],
    controllers: [HealthController],
    providers: [],
})
export class AppModule { }
