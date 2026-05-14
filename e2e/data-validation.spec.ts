/**
 * Phase 3 — Data Validation Tests (SQL layer)
 *
 * These tests verify that API operations produce the correct database state:
 * audit trails, price snapshots, status history, and referential integrity.
 *
 * The UI layer can confirm a status badge changes colour.
 * Only a direct SQL query can confirm the correct audit record was written,
 * that prices were captured at order time, and that foreign keys are intact.
 *
 * Pattern: Act via API → Assert via direct SQL query.
 */
import { test, expect } from '@playwright/test';
import { USERS, SLUGS } from './fixtures/users';
import { loginViaApi } from './helpers/auth';
import { clearCart, getUserAddresses, createOrder, apiRequest } from './helpers/api';
import {
  closeDb,
  getOrderItems,
  getOrderStatusHistory,
  getOrderAddress,
  getStockAdjustments,
  getInventoryRecord,
  getProductPrice,
} from './helpers/db';

const API = 'http://localhost:3001/api/v1';

test.afterAll(async () => {
  await closeDb();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function placeTestOrder() {
  const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
  const addresses = await getUserAddresses(auth.token);
  const addr = addresses.find((a) => a.isDefault) ?? addresses[0];
  if (!addr) throw new Error('Customer has no seeded address — run pnpm db:seed');

  await clearCart(auth.token);
  const product = await apiRequest<{ id: string }>('GET', `/products/slug/${SLUGS.product}`);
  await apiRequest('POST', '/cart/items', { productId: product.id, quantity: 1 }, auth.token);
  const order = await createOrder(auth.token, addr.id);
  return { auth, order };
}

// ─── Price Snapshot Integrity ─────────────────────────────────────────────────

test.describe('Data Validation: Price Snapshot', () => {
  test(
    'checkout captures product price into order_items at time of order @regression',
    async () => {
      /**
       * Business rule: the price a customer sees must equal the price stored in order_items,
       * regardless of any subsequent price change. This is equivalent to a fare-lock in
       * travel booking — price shown must equal price charged.
       */
      const priceBeforeOrder = await getProductPrice(SLUGS.product);
      expect(priceBeforeOrder).not.toBeNull();

      const { order } = await placeTestOrder();

      const items = await getOrderItems(order.orderNumber);
      expect(items.length).toBeGreaterThan(0);
      // unit_price in order_items must match the live product price at checkout time
      expect(items[0]!.unit_price).toBe(priceBeforeOrder);
      // line_total must equal unit_price × quantity (no rounding errors)
      expect(items[0]!.line_total).toBe(items[0]!.unit_price * items[0]!.quantity);
    },
  );
});

// ─── Order Status History Audit Trail ────────────────────────────────────────

test.describe('Data Validation: Order Status History', () => {
  test(
    'checkout writes PENDING_PAYMENT history entry with correct metadata @regression',
    async () => {
      /**
       * Every status transition must be logged in order_status_history.
       * This is the audit trail — required for dispute resolution and compliance.
       * The UI shows a status badge; only a SQL query verifies the audit record exists.
       */
      const { order } = await placeTestOrder();

      const history = await getOrderStatusHistory(order.orderNumber);
      expect(history.length).toBeGreaterThanOrEqual(1);

      const firstEntry = history[0]!;
      expect(firstEntry.from_status).toBeNull(); // first entry has no previous status
      expect(firstEntry.to_status).toBe('PENDING_PAYMENT');
      // The checkout is customer-initiated so changed_by_type is CUSTOMER (not SYSTEM)
      expect(firstEntry.changed_by_type).toBe('CUSTOMER');
    },
  );

  test(
    'order cancellation appends CANCELLED entry with correct from_status and reason @regression',
    async () => {
      const { auth, order } = await placeTestOrder();
      const cancelReason = 'Data validation test — automated cancel';

      await apiRequest('POST', `/orders/${order.id}/cancel`, { reason: cancelReason }, auth.token);

      const history = await getOrderStatusHistory(order.orderNumber);
      const cancelEntry = history.find((h) => h.to_status === 'CANCELLED');

      expect(cancelEntry).toBeDefined();
      expect(cancelEntry!.from_status).toBe('PENDING_PAYMENT');
      expect(cancelEntry!.reason).toBe(cancelReason);
      expect(cancelEntry!.changed_by_type).toBe('CUSTOMER');
    },
  );
});

// ─── Inventory Adjustment Audit Trail ────────────────────────────────────────

test.describe('Data Validation: Stock Adjustment Audit', () => {
  test(
    'inventory adjust creates StockAdjustment record with correct type, quantity, and reference @regression',
    async () => {
      /**
       * Every inventory adjustment must create an audit record in stock_adjustments.
       * The UI shows a toast; only a SQL query confirms the record was persisted correctly.
       */
      const adminAuth = await loginViaApi(USERS.admin.email, USERS.admin.password);
      const product = await apiRequest<{ id: string; sku: string }>(
        'GET',
        `/products/slug/${SLUGS.product}`,
      );

      const countBefore = (await getStockAdjustments(product.sku)).length;

      await apiRequest(
        'PATCH',
        `/admin/inventory/${product.id}/adjust`,
        {
          quantity: 3,
          adjustmentType: 'CORRECTION',
          reason: 'SQL validation test — automated audit check',
          reference: 'TEST-REF-DB-001',
        },
        adminAuth.token,
      );

      const adjustments = await getStockAdjustments(product.sku);
      expect(adjustments.length).toBe(countBefore + 1);

      const newest = adjustments[0]!;
      expect(newest.type).toBe('CORRECTION');
      expect(newest.quantity).toBe(3);
      expect(newest.reason).toBe('SQL validation test — automated audit check');
      expect(newest.reference_id).toBe('TEST-REF-DB-001');
    },
  );

  test(
    'inventory quantityOnHand reflects the exact adjustment delta @regression',
    async () => {
      const adminAuth = await loginViaApi(USERS.admin.email, USERS.admin.password);

      const before = await getInventoryRecord(SLUGS.product);
      const qtyBefore = before[0]!.quantity_on_hand;

      const product = await apiRequest<{ id: string }>('GET', `/products/slug/${SLUGS.product}`);

      await apiRequest(
        'PATCH',
        `/admin/inventory/${product.id}/adjust`,
        { quantity: -2, adjustmentType: 'DAMAGE', reason: 'Damaged goods — SQL delta test' },
        adminAuth.token,
      );

      const after = await getInventoryRecord(SLUGS.product);
      expect(after[0]!.quantity_on_hand).toBe(qtyBefore - 2);
    },
  );
});

// ─── Referential Integrity ────────────────────────────────────────────────────

test.describe('Data Validation: Referential Integrity', () => {
  test(
    'checkout creates an OrderAddress snapshot linked to the order @regression',
    async () => {
      /**
       * The delivery address must be captured as a standalone snapshot (OrderAddress),
       * NOT a reference to the user's saved Address. If the user later changes their
       * address, the order address must remain as it was at checkout.
       */
      const { order } = await placeTestOrder();

      const addresses = await getOrderAddress(order.orderNumber);
      expect(addresses.length).toBe(1);

      const snap = addresses[0]!;
      expect(snap.recipient_name).toBeTruthy();
      expect(snap.city).toBeTruthy();
      expect(snap.county).toBeTruthy();
    },
  );

  test(
    'order_items rows reference the correct order via foreign key @regression',
    async () => {
      const { order } = await placeTestOrder();

      const items = await getOrderItems(order.orderNumber);
      expect(items.length).toBe(1); // one product added to cart

      // If the FK were broken, the JOIN would return zero rows even though order exists
      expect(items[0]!.product_sku).toBeTruthy();
    },
  );
});
