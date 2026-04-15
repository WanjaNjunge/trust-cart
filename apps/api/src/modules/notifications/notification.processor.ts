import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

interface OrderStatusChangedPayload {
    orderId: string;
    orderNumber: string;
    fromStatus: string | null;
    toStatus: string;
    userId?: string;
    userEmail?: string;
    reason?: string;
}

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    async process(job: Job<OrderStatusChangedPayload>): Promise<void> {
        const { name, data } = job;

        switch (name) {
            case 'order.status_changed':
                await this.handleStatusChanged(data);
                break;
            case 'order.confirmed':
                await this.handleOrderConfirmed(data);
                break;
            default:
                this.logger.warn(`Unknown job type: ${name}`);
        }
    }

    private async handleStatusChanged(data: OrderStatusChangedPayload): Promise<void> {
        const { orderNumber, fromStatus, toStatus, reason, userEmail } = data;

        // STUB MODE: Log instead of sending actual notifications
        this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        this.logger.log(`[STUB] ORDER STATUS CHANGED`);
        this.logger.log(`  Order: ${orderNumber}`);
        this.logger.log(`  Status: ${fromStatus || 'NEW'} → ${toStatus}`);
        if (reason) {
            this.logger.log(`  Reason: ${reason}`);
        }
        if (userEmail) {
            this.logger.log(`  Would send email to: ${userEmail}`);
        }
        this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    }

    private async handleOrderConfirmed(data: OrderStatusChangedPayload): Promise<void> {
        const { orderNumber, userEmail } = data;

        // STUB MODE: Log order confirmation notification
        this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        this.logger.log(`[STUB] ORDER CONFIRMED NOTIFICATION`);
        this.logger.log(`  Order: ${orderNumber}`);
        if (userEmail) {
            this.logger.log(`  Would send confirmation email to: ${userEmail}`);
        }
        this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    }
}
