/**
 * Shared constants
 */

// Order status values (matching domain model)
export const ORDER_STATUS = {
    // Pre-Payment
    CREATED: 'CREATED',
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    PAYMENT_FAILED: 'PAYMENT_FAILED',

    // Payment Confirmed
    CONFIRMED: 'CONFIRMED',

    // Fulfillment
    PROCESSING: 'PROCESSING',
    READY_FOR_PICKUP: 'READY_FOR_PICKUP',

    // Delivery
    DISPATCHED: 'DISPATCHED',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    DELIVERY_FAILED: 'DELIVERY_FAILED',

    // Returns
    RETURN_REQUESTED: 'RETURN_REQUESTED',
    RETURN_APPROVED: 'RETURN_APPROVED',
    RETURN_REJECTED: 'RETURN_REJECTED',
    RETURN_RECEIVED: 'RETURN_RECEIVED',

    // Financial Resolution
    REFUND_PENDING: 'REFUND_PENDING',
    REFUNDED: 'REFUNDED',
    PARTIAL_REFUND: 'PARTIAL_REFUND',

    // Closure
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

// Payment methods
export const PAYMENT_METHOD = {
    MPESA_STK: 'MPESA_STK',
    MPESA_PAYBILL: 'MPESA_PAYBILL',
    PAY_ON_DELIVERY: 'PAY_ON_DELIVERY',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

// Delivery zones
export const DELIVERY_ZONE = {
    ZONE_1: 'ZONE_1', // Nairobi CBD & Environs
    ZONE_2: 'ZONE_2', // Greater Nairobi
    ZONE_3: 'ZONE_3', // Other Major Towns
    ZONE_4: 'ZONE_4', // Rest of Kenya
} as const;

export type DeliveryZone = (typeof DELIVERY_ZONE)[keyof typeof DELIVERY_ZONE];

// VAT rate
export const VAT_RATE = 0.16; // 16% Kenya VAT

// Currency
export const CURRENCY = {
    CODE: 'KES',
    SYMBOL: 'KES',
    NAME: 'Kenyan Shilling',
} as const;
