import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
  get heading() { return this.page.locator('h1'); }
  get priceLabel() { return this.page.getByText(/KES|KSh/i).first(); }
  get addToCartButton() { return this.page.getByRole('button', { name: /add to cart/i }); }
  get addedConfirmation() { return this.page.getByText(/added|success|added to cart/i).first(); }

  async goto(slug: string) {
    await this.page.goto(`/products/${slug}`);
  }

  async addToCart() {
    await expect(this.addToCartButton).toBeVisible({ timeout: 10_000 });
    await this.addToCartButton.click();
    await expect(this.addedConfirmation).toBeVisible({ timeout: 8_000 });
  }
}
