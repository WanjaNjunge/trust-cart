import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrderStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminOrdersService } from './admin-orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { InitiateRefundDto } from './dto/initiate-refund.dto';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

@ApiTags('Admin Orders')
@ApiBearerAuth()
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List all orders (Admin — paginated, filterable)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by order number',
  })
  @ApiResponse({ status: 200, description: 'Orders retrieved' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
  ) {
    return this.adminOrdersService.findAll({ page, limit, status, search });
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update order status (Staff+) — valid transitions only, reason required',
  })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminOrdersService.updateStatus(id, dto, user.id);
  }

  @Post(':id/refund')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Initiate a refund (Manager+ only) — creates audit record' })
  @ApiResponse({ status: 201, description: 'Refund initiated' })
  @ApiResponse({ status: 400, description: 'Invalid refund amount or order status' })
  @ApiResponse({ status: 403, description: 'Manager+ role required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async initiateRefund(
    @Param('id') id: string,
    @Body() dto: InitiateRefundDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminOrdersService.initiateRefund(id, dto, user.id, user.role);
  }
}
