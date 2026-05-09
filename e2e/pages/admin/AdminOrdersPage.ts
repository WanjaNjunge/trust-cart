import { expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class AdminOrdersPage extends BasePage {
  readonly url = '/admin/orders';

  get heading() { return this.page.getByRole('heading', { name: /orders/i }); }
  get tableRows() { return this.page.locator('tbody tr'); }
  get statusFilter() { return this.page.locator('select').first(); }
  get updateButton() { return this.page.getByRole('button', { name: /update/i }).first(); }
  get updateStatusHeading() { return this.page.getByRole('heading', { name: /update.*status/i }); }
  get updateStatusButton() { return this.page.getByRole('button', { name: /update status/i }); }
  get successMessage() { return this.page.getByText(/updated|success/i); }

  async goto() {
    await this.page.goto(this.url);
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
    await this.page.waitForLoadState('networkidle');
  }

  async searchByOrderNumber(orderNumber: string) {
    const searchInput = this.page
      .locator('input[placeholder*="order number" i], input[placeholder*="search" i]')
      .first();
    if (await searchInput.isVisible({ timeout: 3_000 })) {
      await searchInput.fill(orderNumber);
      await this.page.waitForLoadState('networkidle');
    }
  }

  async updateFirstOrderStatus(newStatus: string, reason: string) {
    await expect(this.updateButton).toBeVisible({ timeout: 10_000 });
    await this.updateButton.click();
    await expect(this.updateStatusHeading).toBeVisible({ timeout: 5_000 });
    await this.page.locator('select').first().selectOption(newStatus);
    await this.page
      .locator('input[placeholder*="reason" i], input[type="text"]')
      .last()
      .fill(reason);
    await this.updateStatusButton.click();
  }
}
