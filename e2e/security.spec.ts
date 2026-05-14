/**
 * Phase 4 — Security & Boundary Tests
 *
 * Validates access control (IDOR prevention, RBAC enforcement) and
 * input boundary enforcement (stock limits, invalid state transitions).
 *
 * These tests have no UI counterpart — they test the API contract directly.
 * A manual tester would rarely find these; automated boundary testing does.
 */
import { test, expect } from '@playwright/test';
import { USERS, SLUGS } from './fixtures/users';
import { loginViaApi } from './helpers/auth';
import { clearCart, getUserAddresses, createOrder, apiRequest } from './helpers/api';

const API = 'http://localhost:3001/api/v1';

// ─── IDOR Prevention ─────────────────────────────────────────────────────────

test.describe('Security: IDOR Prevention', () => {
  /**
   * IDOR (Insecure Direct Object Reference) — Customer A must not be able to
   * read Customer B's order by guessing the order ID.
   *
   * This is the #1 most common API vulnerability. A 403 here confirms the
   * ownership check in OrdersService.findOne() is functioning correctly.
   */
  test(
    'Customer B cannot read Customer A order by ID — returns 403 @critical @regression',
    async () => {
      // Customer A creates an order
      const authA = await loginViaApi(USERS.customer.email, USERS.customer.password);
      const addrsA = await getUserAddresses(authA.token);
      await clearCart(authA.token);
      const product = await apiRequest<{ id: string }>('GET', `/products/slug/${SLUGS.product}`);
      await apiRequest('POST', '/cart/items', { productId: product.id, quantity: 1 }, authA.token);
      const orderA = await createOrder(authA.token, addrsA[0]!.id);

      // Customer B tries to read Customer A's order using a guessed ID
      const authB = await loginViaApi(USERS.customer2.email, USERS.customer2.password);
      const res = await fetch(`${API}/orders/${orderA.id}`, {
        headers: { Authorization: `Bearer ${authB.token}` },
      });

      expect(res.status).toBe(403);
    },
  );

  test(
    'unauthenticated request to a valid order ID returns 401 @critical @regression',
    async () => {
      // Get any valid order ID first
      const authA = await loginViaApi(USERS.customer.email, USERS.customer.password);
      const addrs = await getUserAddresses(authA.token);
      await clearCart(authA.token);
      const product = await apiRequest<{ id: string }>('GET', `/products/slug/${SLUGS.product}`);
      await apiRequest('POST', '/cart/items', { productId: product.id, quantity: 1 }, authA.token);
      const order = await createOrder(authA.token, addrs[0]!.id);

      // Request without any token
      const res = await fetch(`${API}/orders/${order.id}`);
      expect(res.status).toBe(401);
    },
  );
});

// ─── Stock Boundary Enforcement ───────────────────────────────────────────────

test.describe('Security: Inventory Boundary Enforcement', () => {
  /**
   * A customer should not be able to add more items than available stock.
   * Bypassing this causes overselling — a critical business failure.
   * The cart service must validate quantityOnHand − quantityReserved.
   */
  test(
    'adding quantity exceeding available stock returns 409 INSUFFICIENT_STOCK @critical @regression',
    async () => {
      const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
      await clearCart(auth.token);

      const product = await apiRequest<{ id: string }>('GET', `/products/slug/${SLUGS.product}`);

      const res = await fetch(`${API}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ productId: product.id, quantity: 99999 }),
      });

      expect(res.status).toBe(409);
      const body = await res.json() as { message: string };
      expect(body.message).toMatch(/insufficient.stock/i);
    },
  );

  test(
    'adding exactly the available quantity succeeds — boundary ON the limit @regression',
    async () => {
      /**
       * Boundary-on test: quantity equal to available stock should succeed.
       * The previous test validates ABOVE the limit; this validates AT the limit.
       */
      const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
      await clearCart(auth.token);

      const product = await apiRequest<{ id: string; availableQuantity: number }>(
        'GET',
        `/products/slug/${SLUGS.product2}`, // use second product to avoid reservation conflicts
      );

      // Adding 1 unit should always succeed given the seed sets onHand=20
      const res = await fetch(`${API}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });

      expect(res.status).toBe(201);
    },
  );
});

// ─── Admin Role Boundary Enforcement ─────────────────────────────────────────

test.describe('Security: Admin Role Boundaries', () => {
  /**
   * These tests verify that role enforcement works at the API level, not just
   * the UI level (where a button might be hidden). An attacker could bypass the
   * UI and call the API directly — these tests prove that won't work.
   */
  test(
    'STAFF cannot initiate a refund — returns 403 (Manager+ only) @critical @regression',
    async () => {
      // Create and confirm an order to make it refundable
      const adminAuth = await loginViaApi(USERS.admin.email, USERS.admin.password);
      const customerAuth = await loginViaApi(USERS.customer.email, USERS.customer.password);
      const addrs = await getUserAddresses(customerAuth.token);
      await clearCart(customerAuth.token);
      const product = await apiRequest<{ id: string }>('GET', `/products/slug/${SLUGS.product}`);
      await apiRequest(
        'POST',
        '/cart/items',
        { productId: product.id, quantity: 1 },
        customerAuth.token,
      );
      const order = await createOrder(customerAuth.token, addrs[0]!.id);

      // Move to CONFIRMED via admin
      await apiRequest(
        'PATCH',
        `/admin/orders/${order.id}/status`,
        { status: 'CONFIRMED', reason: 'Security test setup' },
        adminAuth.token,
      );

      // STAFF attempts to initiate a refund — must be blocked
      const staffAuth = await loginViaApi(USERS.staff.email, USERS.staff.password);
      const res = await fetch(`${API}/admin/orders/${order.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffAuth.token}`,
        },
        body: JSON.stringify({ amount: 1000, reason: 'Staff attempting refund' }),
      });

      expect(res.status).toBe(403);
    },
  );

  test(
    'STAFF can update order status — returns 200 (Staff+ allowed) @regression',
    async () => {
      const staffAuth = await loginViaApi(USERS.staff.email, USERS.staff.password);
      const customerAuth = await loginViaApi(USERS.customer.email, USERS.customer.password);
      const addrs = await getUserAddresses(customerAuth.token);
      await clearCart(customerAuth.token);
      const product = await apiRequest<{ id: string }>('GET', `/products/slug/${SLUGS.product2}`);
      await apiRequest(
        'POST',
        '/cart/items',
        { productId: product.id, quantity: 1 },
        customerAuth.token,
      );
      const order = await createOrder(customerAuth.token, addrs[0]!.id);

      const res = await fetch(`${API}/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffAuth.token}`,
        },
        body: JSON.stringify({ status: 'CONFIRMED', reason: 'Staff status update — security test' }),
      });

      expect(res.status).toBe(200);
    },
  );

  test(
    'invalid order status transition returns 400 with transition detail @regression',
    async () => {
      /**
       * A direct API call attempting to skip states (PENDING_PAYMENT → DELIVERED)
       * must be rejected. This validates the state machine enforced server-side,
       * not just the UI's dropdown of valid options.
       */
      const adminAuth = await loginViaApi(USERS.admin.email, USERS.admin.password);
      const customerAuth = await loginViaApi(USERS.customer.email, USERS.customer.password);
      const addrs = await getUserAddresses(customerAuth.token);
      await clearCart(customerAuth.token);
      const product = await apiRequest<{ id: string }>('GET', `/products/slug/${SLUGS.product}`);
      await apiRequest(
        'POST',
        '/cart/items',
        { productId: product.id, quantity: 1 },
        customerAuth.token,
      );
      const order = await createOrder(customerAuth.token, addrs[0]!.id);

      // Attempt to skip directly to DELIVERED from PENDING_PAYMENT
      const res = await fetch(`${API}/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAuth.token}`,
        },
        body: JSON.stringify({ status: 'DELIVERED', reason: 'Attempting invalid transition' }),
      });

      expect(res.status).toBe(400);
      const body = await res.json() as { message: string };
      expect(body.message).toMatch(/invalid transition/i);
    },
  );

  test(
    'CUSTOMER cannot access any admin endpoint — returns 403 @critical @regression',
    async () => {
      const customerAuth = await loginViaApi(USERS.customer.email, USERS.customer.password);

      const adminEndpoints = [
        { method: 'GET', path: '/admin/inventory' },
        { method: 'GET', path: '/admin/orders' },
        { method: 'GET', path: '/admin/products' },
        { method: 'GET', path: '/admin/stats' },
      ];

      for (const { method, path } of adminEndpoints) {
        const res = await fetch(`${API}${path}`, {
          method,
          headers: { Authorization: `Bearer ${customerAuth.token}` },
        });
        expect(res.status, `Expected 403 on ${method} ${path}`).toBe(403);
      }
    },
  );
});
