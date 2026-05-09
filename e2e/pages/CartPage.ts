import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  readonly url = '/cart';

  get checkoutLink() { return this.page.getByRole('link', { name: /proceed to checkout/i }); }
  get promoInput() { return this.page.locator('input[placeholder="Promo code"]'); }
  get applyPromoButton() { return this.page.getByRole('button', { name: /apply/i }); }
  get promoError() { return this.page.getByText(/invalid|not found|expired|error/i); }

  async goto() {
    await this.page.goto(this.url);
  }

  async expectItem(namePattern: RegExp | string) {
    await expect(this.page.getByText(namePattern).first()).toBeVisible({ timeout: 10_000 });
  }

  async removeFirstItem() {
    await this.page.getByRole('button', { name: /remove/i }).first().click();
    const modal = this.page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await modal.getByRole('button', { name: /remove/i }).click();
  }

  async applyPromoCode(code: string) {
    await expect(this.promoInput).toBeVisible({ timeout: 10_000 });
    await this.promoInput.fill(code);
    await this.applyPromoButton.click();
  }

  async proceedToCheckout() {
    await this.checkoutLink.click();
    await expect(this.page).toHaveURL(/checkout/, { timeout: 10_000 });
  }
}
