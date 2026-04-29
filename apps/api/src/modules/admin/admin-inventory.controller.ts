import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminInventoryService } from './admin-inventory.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

@ApiTags('Admin Inventory')
@ApiBearerAuth()
@Controller('admin/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
export class AdminInventoryController {
  constructor(private readonly adminInventoryService: AdminInventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List all products with inventory levels (Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Inventory list retrieved' })
  async getInventory(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.adminInventoryService.getInventoryList({ page, limit, search });
  }

  @Patch(':productId/adjust')
  @ApiOperation({
    summary: 'Adjust inventory for a product (creates StockAdjustment audit record)',
  })
  @ApiResponse({ status: 200, description: 'Inventory adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Adjustment would result in negative stock' })
  @ApiResponse({ status: 404, description: 'Product or inventory record not found' })
  async adjust(
    @Param('productId') productId: string,
    @Body() dto: AdjustInventoryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminInventoryService.adjustInventory(productId, dto, user.id);
  }
}
