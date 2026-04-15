import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    // PoD Configuration
    private readonly POD_LIMIT = 30000; // KES 30,000

    constructor(private prisma: PrismaService) { }

    async initiatePayment(userId: string | undefined, dto: InitiatePaymentDto) {
        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
            include: {
                address: true,
            },
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        if (order.status !== OrderStatus.PENDING_PAYMENT) {
            throw new BadRequestException('Order is not in a payable state');
        }

        // Verify user ownership if logged in
        if (userId && order.userId !== userId) {
            throw new BadRequestException('Order does not belong to user');
        }

        // Handle Pay on Delivery
        if (order.paymentMethod === PaymentMethod.POD_CASH || order.paymentMethod === PaymentMethod.MPESA_STK) {
            // Re-verify method for clarity, though currently we might initiate MPesa for MPesa orders
            // and PoD for PoD orders.
        }

        if (order.paymentMethod === PaymentMethod.POD_CASH) {
            return this.handlePoDInit(order);
        } else if (order.paymentMethod === PaymentMethod.MPESA_STK) {
            return this.handleMpesaInit(order, dto.phoneNumber);
        } else {
            throw new BadRequestException('Unsupported payment method');
        }
    }

    private async handlePoDInit(order: any) {
        // 1. Validate Limit
        if (order.total > this.POD_LIMIT) {
            throw new BadRequestException(`Pay on Delivery is limited to KES ${this.POD_LIMIT.toLocaleString()}`);
        }

        // 2. Validate Zone (Mock validation - checking for major cities)
        // In a real app, we'd check against a specific list of allowed delivery zones/postal codes
        const allowedCounties = ['Nairobi', 'Kiambu', 'Kajiado', 'Machakos'];
        if (order.address && !allowedCounties.includes(order.address.county)) {
            // We allow it for now for demo purposes if it's not strictly restricted by business rule implementation
            // implementing strict check:
            if (!allowedCounties.includes(order.address.county)) {
                throw new BadRequestException('Pay on Delivery is only available in Nairobi and surrounding areas');
            }
        }

        // 3. Confirm Order Immediately
        return this.prisma.$transaction(async (tx: any) => {
            // Create Payment Transaction (Pending Collection)
            const transaction = await tx.paymentTransaction.create({
                data: {
                    orderId: order.id,
                    method: PaymentMethod.POD_CASH,
                    amount: order.total,
                    status: PaymentStatus.PENDING, // Pending collection
                    idempotencyKey: `POD-${order.id}-${Date.now()}`,
                    providerRef: 'POD_PENDING',
                },
            });

            // Update Order Status
            await tx.order.update({
                where: { id: order.id },
                data: {
                    status: OrderStatus.CONFIRMED,
                },
            });

            // Add History
            await tx.orderStatusHistory.create({
                data: {
                    orderId: order.id,
                    fromStatus: OrderStatus.PENDING_PAYMENT,
                    toStatus: OrderStatus.CONFIRMED,
                    reason: 'Pay on Delivery confirmed',
                },
            });

            this.logger.log(`PoD Order ${order.orderNumber} confirmed`);

            return {
                status: 'CONFIRMED',
                message: 'Order confirmed. Please pay on delivery.',
                transactionId: transaction.id,
            };
        });
    }

    private async handleMpesaInit(order: any, _phoneNumber?: string) {
        // STUB IMPLEMENTATION

        // Simulate MPesa STK Push
        const transaction = await this.prisma.paymentTransaction.create({
            data: {
                orderId: order.id,
                method: PaymentMethod.MPESA_STK,
                amount: order.total,
                status: PaymentStatus.INITIATED,
                idempotencyKey: `MPESA-${order.id}-${Date.now()}`,
                providerRef: `STUB-REQ-${Date.now()}`,
            },
        });

        // Simulate Async Callback (using setTimeout in stub mode - simplistic approach for MVP demo)
        // IN A REAL APP: This would be handled by an external callback webhook
        // For this stub, we'll just return INITIATED and let the frontend poll or wait, 
        // BUT since we don't have a background worker yet for the stub delay self-triggering,
        // we will simulate the "Action" of sending the push.

        // To make sure the frontend sees a change, user will "click" simulate on frontend or we auto-confirm after N seconds.
        // Let's implement a 'mock' callback endpoint the frontend can call, or better yet,
        // Isolate the stub logic.

        // DECISION: Return INITIATED. 
        // We will rely on the `handleMpesaCallback` to be called manually or by a simple internal timeout if Node stays alive.
        // Since Vercel/Serverless implementations might kill the process, relying on setTimeout is risky.
        // However, for this local dev MVP, it is acceptable.

        setTimeout(() => {
            this.completeStubMpesaPayment(order.id, transaction.id);
        }, 5000); // 5 seconds delay

        return {
            status: 'INITIATED',
            message: 'STK Push sent to your phone',
            transactionId: transaction.id,
        };
    }

    // Internal helper for stubbing
    private async completeStubMpesaPayment(orderId: string, transactionId: string) {
        try {
            await this.prisma.$transaction(async (tx: any) => {
                await tx.paymentTransaction.update({
                    where: { id: transactionId },
                    data: {
                        status: PaymentStatus.CONFIRMED,
                        confirmedAt: new Date(),
                        providerRef: `STUB-RCPT-${Date.now()}`
                    }
                });

                await tx.order.update({
                    where: { id: orderId },
                    data: { status: OrderStatus.CONFIRMED }
                });

                await tx.orderStatusHistory.create({
                    data: {
                        orderId: orderId,
                        fromStatus: OrderStatus.PENDING_PAYMENT,
                        toStatus: OrderStatus.CONFIRMED,
                        reason: 'MPesa Payment Confirmed (Stub)',
                    },
                });
            });
            this.logger.log(`Stub MPesa payment completed for Order ${orderId}`);
        } catch (e) {
            this.logger.error(`Failed to complete stub payment for order ${orderId}`, e);
        }
    }
}
