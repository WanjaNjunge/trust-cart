import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminProductsController } from './admin.products.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';

@Module({
    imports: [PrismaModule, ProductsModule],
    controllers: [AdminController, AdminProductsController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule { }
