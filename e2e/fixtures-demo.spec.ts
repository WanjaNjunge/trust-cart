/**
 * Fixtures Demo — Phase 5
 *
 * Demonstrates the custom Playwright fixture pattern and the test data factory.
 * Each test receives a pre-authenticated page with zero boilerplate.
 *
 * Before fixtures (3-4 lines per test):
 *   const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
 *   await setAuthInBrowser(page, auth);
 *   await page.goto('/account');
 *
 * After fixtures (intent only):
 *   test('...', async ({ customerPage }) => {
 *     await customerPage.goto('/account');
 *   });
 */
import { test, expect } from './fixtures/playwright.fixtures';
import { createTestCustomer } from './fixtures/test-data-factory';
import { clearCart } from './helpers/api';

// ─── Fixture-based auth tests ─────────────────────────────────────────────────

test.describe('Fixture Demo: Authenticated Pages', () => {
  test(
    'customerPage fixture lands on account with auth already set @regression',
    async ({ customerPage }) => {
      await customerPage.goto('/account');
      // The fixture injected the token — no login form needed
      await expect(customerPage.locator('h1')).toBeVisible({ timeout: 8_000 });
      await expect(customerPage).not.toHaveURL(/login/);
    },
  );

  test(
    'adminPage fixture can reach the admin dashboard @regression',
    async ({ adminPage }) => {
      await adminPage.goto('/admin');
      await expect(adminPage.getByText(/total revenue/i)).toBeVisible({ timeout: 10_000 });
    },
  );

  test(
    'staffPage fixture can reach admin but is not customer-blocked @regression',
    async ({ staffPage }) => {
      await staffPage.goto('/admin');
      await expect(staffPage.locator('body')).not.toContainText('403', { timeout: 8_000 });
    },
  );

  test(
    'customerAuth fixture provides a token for direct API calls @regression',
    async ({ customerAuth }) => {
      // customerAuth.token can be used in fetch/apiRequest without a browser
      const res = await fetch('http://localhost:3001/api/v1/users/me', {
        headers: { Authorization: `Bearer ${customerAuth.token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { email: string };
      expect(body.email).toBe('john.doe@example.com');
    },
  );
});

// ─── Data factory demo ────────────────────────────────────────────────────────

test.describe('Fixture Demo: Test Data Factory', () => {
  test(
    'createTestCustomer returns a unique user with a valid JWT @regression',
    async () => {
      const user = await createTestCustomer();

      // Email is unique per test run — no collision with other tests or seeded accounts
      expect(user.email).toMatch(/@trustcart-e2e\.test$/);
      expect(user.token).toBeTruthy();
      expect(user.userId).toBeTruthy();

      // The token is valid — /users/me returns the correct user
      const res = await fetch('http://localhost:3001/api/v1/users/me', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { email: string };
      expect(body.email).toBe(user.email);
    },
  );

  test(
    'factory users have isolated carts — no shared state with seeded customers @regression',
    async () => {
      // Two factory users operate completely independently
      const userA = await createTestCustomer();
      const userB = await createTestCustomer();

      // Clear both carts (should already be empty for brand-new users)
      await clearCart(userA.token);
      await clearCart(userB.token);

      // Add a product to User A's cart
      const product = await fetch('http://localhost:3001/api/v1/products/slug/hp-elitebook-840-g6')
        .then((r) => r.json()) as { id: string };

      await fetch('http://localhost:3001/api/v1/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userA.token}`,
        },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });

      // User B's cart must remain empty — different userId, different cart
      const cartB = await fetch('http://localhost:3001/api/v1/cart', {
        headers: { Authorization: `Bearer ${userB.token}` },
      }).then((r) => r.json()) as { items: unknown[] };

      expect(cartB.items).toHaveLength(0);
    },
  );
});
