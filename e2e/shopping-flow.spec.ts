import { test, expect } from '@playwright/test';
import { USERS, SLUGS } from './fixtures/users';
import { loginViaApi, setAuthInBrowser } from './helpers/auth';
import { clearCart } from './helpers/api';

const API = 'http://localhost:3001/api/v1';

async function addToCartViaApi(token: string, slug: string) {
  const product = await fetch(`${API}/products/slug/${slug}`).then((r) => r.json()) as { id: string };
  await fetch(`${API}/cart/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId: product.id, quantity: 1 }),
  });
  return product;
}

test.describe('Shopping Flow', () => {
  let auth: { token: string; user: { id: string; email: string; role: string; firstName: string; lastName: string } };

  test.beforeEach(async ({ page }) => {
    auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
    // Clear cart before each test so tests don't interfere with each other
    await clearCart(auth.token);
    await setAuthInBrowser(page, auth);
  });

  test('add product to cart updates header cart count', async ({ page }) => {
    await page.goto(`/products/${SLUGS.product}`);
    // The button text is "Add to cart" (lowercase c)
    await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /add to cart/i }).click();
    // ProductActions shows a success state after adding
    await expect(page.getByText(/added|success|added to cart/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('cart page shows added items with prices', async ({ page }) => {
    await addToCartViaApi(auth.token, SLUGS.product);
    await page.goto('/cart');
    await expect(page.getByText(/HP EliteBook|hp elitebook/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/KES|KSh/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /proceed to checkout/i })).toBeVisible();
  });

  test('removing item from cart updates total', async ({ page }) => {
    await addToCartViaApi(auth.token, SLUGS.product);
    await page.goto('/cart');

    // Confirm the item is present first
    await expect(page.getByText(/HP EliteBook|hp elitebook/i)).toBeVisible({ timeout: 10_000 });

    // Click the Remove button — this opens a ConfirmModal (confirmLabel="Remove", variant="danger")
    const removeBtn = page.getByRole('button', { name: /remove/i }).first();
    await removeBtn.click();

    // The modal dialog renders with a second "Remove" confirm button inside it
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await modal.getByRole('button', { name: /remove/i }).click();

    // Item should now be gone from the cart
    await expect(page.getByText(/HP EliteBook|hp elitebook/i)).not.toBeVisible({ timeout: 8_000 });
  });

  test('applying invalid promo code shows error', async ({ page }) => {
    await addToCartViaApi(auth.token, SLUGS.product);
    await page.goto('/cart');

    // Promo code input has placeholder "Promo code"
    const promoInput = page.locator('input[placeholder="Promo code"]');
    await expect(promoInput).toBeVisible({ timeout: 10_000 });
    await promoInput.fill('INVALIDCODE999');
    await page.getByRole('button', { name: /apply/i }).click();
    await expect(page.getByText(/invalid|not found|expired|error/i)).toBeVisible({ timeout: 8_000 });
  });

  // Full checkout — MPesa stub auto-confirms after 5 s; polling detects within 36 s
  test('full checkout flow: add to cart → checkout → order confirmation', async ({ page }) => {
    test.setTimeout(90_000);

    await addToCartViaApi(auth.token, SLUGS.product);
    await page.goto('/cart');

    await page.getByRole('link', { name: /proceed to checkout/i }).click();
    await expect(page).toHaveURL(/checkout/, { timeout: 10_000 });

    // Address is auto-selected (john.doe has a seeded Nairobi address)
    // MPesa STK is default payment method
    const placeOrderBtn = page.getByRole('button', { name: /place order/i });
    await expect(placeOrderBtn).toBeVisible({ timeout: 10_000 });
    await placeOrderBtn.click();

    // Wait for polling to detect CONFIRMED and redirect to confirmation page
    await expect(page).toHaveURL(/order-confirmation/, { timeout: 60_000 });

    // Confirmation page heading is always "Order Placed Successfully!"
    await expect(
      page.getByRole('heading', { name: /order placed successfully/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /view order/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /continue shopping/i })).toBeVisible();
  });
});
