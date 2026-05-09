import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
  get placeOrderButton() { return this.page.getByRole('button', { name: /place order/i }); }
  get confirmationHeading() { return this.page.getByRole('heading', { name: /order placed successfully/i }); }
  get viewOrderLink() { return this.page.getByRole('link', { name: /view order/i }); }
  get continueShoppingLink() { return this.page.getByRole('link', { name: /continue shopping/i }); }

  async placeOrder() {
    await expect(this.placeOrderButton).toBeVisible({ timeout: 10_000 });
    await this.placeOrderButton.click();
  }

  async waitForOrderConfirmation() {
    await expect(this.page).toHaveURL(/order-confirmation/, { timeout: 60_000 });
    await expect(this.confirmationHeading).toBeVisible({ timeout: 15_000 });
  }
}
