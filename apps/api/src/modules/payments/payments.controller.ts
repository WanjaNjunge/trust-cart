import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate payment for an order' })
  @ApiResponse({ status: 201, description: 'Payment initiated or confirmed' })
  async initiate(@CurrentUser() user: AuthUser | undefined, @Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiatePayment(user?.id, dto);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment transaction status (owner or Staff+)' })
  @ApiResponse({ status: 200, description: 'Payment transaction retrieved' })
  @ApiResponse({ status: 403, description: 'Access denied — not the order owner or staff' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getPayment(@Param('id') id: string, @CurrentUser() user: AuthUser | undefined) {
    return this.paymentsService.getPayment(id, user?.id, user?.role);
  }
}
