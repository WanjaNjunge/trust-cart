import { Controller, Post, Body, UseGuards } from '@nestjs/common';
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
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('initiate')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Initiate payment for an order' })
    @ApiResponse({ status: 201, description: 'Payment initiated or confirmed' })
    async initiate(
        @CurrentUser() user: AuthUser | undefined,
        @Body() dto: InitiatePaymentDto,
    ) {
        return this.paymentsService.initiatePayment(user?.id, dto);
    }
}
