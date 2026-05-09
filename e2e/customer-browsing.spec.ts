import { test, expect } from '@playwright/test';
import { SLUGS } from './fixtures/users';

test.describe('Customer Browsing', () => {
  test('home page loads with product cards', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/TrustCart/i);
    // Header is present
    await expect(page.locator('#global-trustcart-header')).toBeVisible();
    // At least one product card is visible (products section)
    const productCards = page.locator('a[href^="/products/"]');
    await expect(productCards.first()).toBeVisible({ timeout: 10_000 });
  });

  test('category page shows filtered products', { tag: ['@regression'] }, async ({ page }) => {
    await page.goto(`/categories/${SLUGS.category}`);
    // Heading contains category name
    await expect(page.locator('h1')).toContainText(/laptop/i, { timeout: 10_000 });
    // Products are listed
    const products = page.locator('a[href^="/products/"]');
    await expect(products.first()).toBeVisible({ timeout: 10_000 });
  });

  test('product detail page shows images, price and add-to-cart', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
    await page.goto(`/products/${SLUGS.product}`);
    // Product name is in the heading
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
    // Price shown (KES prefix)
    await expect(page.getByText(/KES|KSh/i).first()).toBeVisible();
    // Add to Cart button present
    await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible();
  });

  test('search results page returns matching products', { tag: ['@regression'] }, async ({ page }) => {
    await page.goto('/search?q=laptop');
    // At least one result
    const results = page.locator('a[href^="/products/"]');
    await expect(results.first()).toBeVisible({ timeout: 10_000 });
  });

  test('search for gibberish shows empty state', { tag: ['@regression'] }, async ({ page }) => {
    await page.goto('/search?q=xyznonexistentproduct999');
    // Empty state message — page still renders without error
    await expect(page.locator('body')).not.toContainText('500');
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
    // The search page shows "We couldn't find any products matching..."
    const noResults = page.getByText(/couldn't find|no products|no result/i).first();
    await expect(noResults).toBeVisible({ timeout: 10_000 });
  });

  test('clicking a product card navigates to its detail page', { tag: ['@regression'] }, async ({ page }) => {
    await page.goto('/categories/laptops');
    const firstCard = page.locator('a[href^="/products/"]').first();
    await firstCard.waitFor({ timeout: 10_000 });
    const href = await firstCard.getAttribute('href');
    await firstCard.click();
    await expect(page).toHaveURL(new RegExp(href!), { timeout: 10_000 });
    await expect(page.locator('h1')).toBeVisible();
  });
});
