import { test, expect } from '@playwright/test';
import { USERS } from './fixtures/users';
import { loginViaApi, setAuthInBrowser } from './helpers/auth';
import { getUserAddresses, createOrder, clearCart } from './helpers/api';

let confirmedOrderId: string;
let confirmedOrderNumber: string;

test.describe('Order Management (Customer)', () => {
  test.beforeAll(async () => {
    const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
    const addresses = await getUserAddresses(auth.token);
    const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (!defaultAddress) throw new Error('Customer has no seeded address — run pnpm db:seed');

    await clearCart(auth.token);
    const product = await fetch(
      'http://localhost:3001/api/v1/products/slug/hp-elitebook-840-g6',
    ).then((r) => r.json()) as { id: string };
    await fetch('http://localhost:3001/api/v1/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ productId: product.id, quantity: 1 }),
    });

    const order = await createOrder(auth.token, defaultAddress.id);
    confirmedOrderId = order.id;
    confirmedOrderNumber = order.orderNumber;
  });

  test.beforeEach(async ({ page }) => {
    const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
    await setAuthInBrowser(page, auth);
  });

  test('order history page shows user orders', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.getByText(/your orders/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(confirmedOrderNumber)).toBeVisible({ timeout: 10_000 });
  });

  test('order detail page shows items, address, and status timeline', async ({ page }) => {
    await page.goto(`/orders/${confirmedOrderId}`);
    await expect(page.getByText(confirmedOrderNumber)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/HP EliteBook|item/i)).toBeVisible();
    await expect(page.getByText(/Pending Payment|PENDING_PAYMENT/i)).toBeVisible();
  });

  test('unauthenticated access to orders shows login prompt', async ({ page }) => {
    // Orders page uses a LoginPrompt component — it stays at /orders (no redirect)
    await page.evaluate(() => localStorage.clear());
    await page.goto('/orders');
    // The LoginPrompt renders on the same URL — not a router redirect
    await expect(page.getByRole('link', { name: /sign in|log in|login/i }).first()).toBeVisible({
      timeout: 8_000,
    });
  });

  test('order detail shows cancel button for PENDING_PAYMENT orders', async ({ page }) => {
    await page.goto(`/orders/${confirmedOrderId}`);
    await expect(page.getByText(confirmedOrderNumber)).toBeVisible({ timeout: 10_000 });
    // The cancel button opens a CancelOrderModal
    const cancelBtn = page.getByRole('button', { name: /cancel order/i });
    await expect(cancelBtn).toBeVisible({ timeout: 10_000 });
  });

  test('cancel order changes status to CANCELLED', async ({ page }) => {
    const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
    const addresses = await getUserAddresses(auth.token);
    const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

    await clearCart(auth.token);
    const product = await fetch(
      'http://localhost:3001/api/v1/products/slug/lenovo-thinkpad-t480',
    ).then((r) => r.json()) as { id: string };
    await fetch('http://localhost:3001/api/v1/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ productId: product.id, quantity: 1 }),
    });

    const cancelTarget = await createOrder(auth.token, defaultAddress!.id);

    await setAuthInBrowser(page, auth);
    await page.goto(`/orders/${cancelTarget.id}`);

    // Click "Cancel Order" to open the CancelOrderModal
    const cancelBtn = page.getByRole('button', { name: /cancel order/i });
    await expect(cancelBtn).toBeVisible({ timeout: 10_000 });
    await cancelBtn.click();

    // Modal confirm button says "Yes, Cancel Order"
    const confirmBtn = page.getByRole('button', { name: /yes.*cancel|yes, cancel order/i });
    await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
    await confirmBtn.click();

    await expect(page.getByText(/cancelled/i)).toBeVisible({ timeout: 10_000 });
  });
});
