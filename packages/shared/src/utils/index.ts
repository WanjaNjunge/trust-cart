/**
 * Shared utility functions
 */

import { CURRENCY, VAT_RATE } from '../constants';

/**
 * Format a number as Kenyan Shillings
 * @param amount - The amount in KES
 * @returns Formatted string e.g., "KES 45,990"
 */
export function formatCurrency(amount: number): string {
  return `${CURRENCY.SYMBOL} ${amount.toLocaleString('en-KE')}`;
}

/**
 * Calculate VAT from a VAT-inclusive price
 * VAT = Price × (16 ÷ 116)
 * @param inclusivePrice - The VAT-inclusive price
 * @returns The VAT component
 */
export function calculateVat(inclusivePrice: number): number {
  return Math.round(inclusivePrice * (VAT_RATE / (1 + VAT_RATE)));
}

/**
 * Calculate price excluding VAT from VAT-inclusive price
 * @param inclusivePrice - The VAT-inclusive price
 * @returns The price excluding VAT
 */
export function priceExcludingVat(inclusivePrice: number): number {
  return inclusivePrice - calculateVat(inclusivePrice);
}

/**
 * Validate Kenyan phone number
 * Accepts formats: 0712345678, +254712345678, 254712345678
 * @param phone - The phone number to validate
 * @returns True if valid Kenyan phone number
 */
export function isValidKenyanPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s+/g, '');
  const regex = /^(?:\+?254|0)?[17]\d{8}$/;
  return regex.test(cleaned);
}

/**
 * Normalize Kenyan phone number to 254XXXXXXXXX format
 * @param phone - The phone number to normalize
 * @returns Normalized phone number or null if invalid
 */
export function normalizeKenyanPhone(phone: string): string | null {
  if (!isValidKenyanPhone(phone)) {
    return null;
  }

  const cleaned = phone.replace(/\s+/g, '').replace(/^\+/, '');

  if (cleaned.startsWith('0')) {
    return '254' + cleaned.slice(1);
  }

  if (cleaned.startsWith('254')) {
    return cleaned;
  }

  return '254' + cleaned;
}

/**
 * Mask email for display (privacy)
 * john.doe@example.com → j***e@example.com
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***';

  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }

  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Mask phone number for display (privacy)
 * 254712345678 → 2547***5678
 */
export function maskPhone(phone: string): string {
  if (phone.length < 8) return '***';
  return phone.slice(0, 4) + '***' + phone.slice(-4);
}
