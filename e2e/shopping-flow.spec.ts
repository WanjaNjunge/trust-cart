import { test, expect } from '@playwright/test';
import { USERS, SLUGS } from './fixtures/users';
import { loginViaApi, setAuthInBrowser } from './helpers/auth';
import { clearCart, addToCartApi } from './helpers/api';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';

test.describe('Shopping Flow', () => {
  let auth: { token: string; user: { id: string; email: string; role: string; firstName: string; lastName: string } };

  test.beforeEach(async ({ page }) => {
    auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
    await clearCart(auth.token);
    await setAuthInBrowser(page, auth);
  });

  test('add product to cart updates header cart count', async ({ page }) => {
    const productPage = new ProductPage(page);
    await productPage.goto(SLUGS.product);
    await productPage.addToCart();
  });

  test('cart page shows added items with prices', async ({ page }) => {
    await addToCartApi(auth.token, SLUGS.product);

    const cartPage = new CartPage(page);
    await cartPage.goto();
    await cartPage.expectItem(/HP EliteBook|hp elitebook/i);
    await expect(page.getByText(/KES|KSh/i).first()).toBeVisible();
    await expect(cartPage.checkoutLink).toBeVisible();
  });

  test('removing item from cart updates total', async ({ page }) => {
    await addToCartApi(auth.token, SLUGS.product);

    const cartPage = new CartPage(page);
    await cartPage.goto();
    await cartPage.expectItem(/HP EliteBook|hp elitebook/i);
    await cartPage.removeFirstItem();
    await expect(page.getByText(/HP EliteBook|hp elitebook/i)).not.toBeVisible({ timeout: 8_000 });
  });

  test('applying invalid promo code shows error', async ({ page }) => {
    await addToCartApi(auth.token, SLUGS.product);

    const cartPage = new CartPage(page);
    await cartPage.goto();
    await cartPage.applyPromoCode('INVALIDCODE999');
    await expect(cartPage.promoError).toBeVisible({ timeout: 8_000 });
  });

  // MPesa stub auto-confirms after 5 s; checkout polls every 3 s, max 12 attempts
  test('full checkout flow: add to cart → checkout → order confirmation', async ({ page }) => {
    test.setTimeout(90_000);

    await test.step('seed cart via API', async () => {
      await addToCartApi(auth.token, SLUGS.product);
    });

    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await test.step('navigate to checkout', async () => {
      await cartPage.goto();
      await cartPage.proceedToCheckout();
    });

    await test.step('place order (MPesa STK stub)', async () => {
      await checkoutPage.placeOrder();
    });

    await test.step('confirm order and verify confirmation page', async () => {
      await checkoutPage.waitForOrderConfirmation();
      await expect(checkoutPage.viewOrderLink).toBeVisible();
      await expect(checkoutPage.continueShoppingLink).toBeVisible();
    });
  });
});
