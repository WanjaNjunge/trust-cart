import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AdminController } from './admin.controller';
import { AdminProductsController } from './admin.products.controller';
import { AdminInventoryController } from './admin-inventory.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminService } from './admin.service';
import { AdminInventoryService } from './admin-inventory.service';
import { AdminOrdersService } from './admin-orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [PrismaModule, ProductsModule, BullModule.registerQueue({ name: 'notifications' })],
  controllers: [
    AdminController,
    AdminProductsController,
    AdminInventoryController,
    AdminOrdersController,
  ],
  providers: [AdminService, AdminInventoryService, AdminOrdersService],
  exports: [AdminService],
})
export class AdminModule {}
