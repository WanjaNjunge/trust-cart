import { expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class AdminInventoryPage extends BasePage {
  readonly url = '/admin/inventory';

  get heading() { return this.page.getByRole('heading', { name: /inventory/i }); }
  get tableRows() { return this.page.locator('tbody tr'); }
  get searchInput() { return this.page.locator('input[placeholder*="search" i]'); }
  get adjustButton() { return this.page.getByRole('button', { name: /adjust/i }).first(); }
  get adjustModalHeading() { return this.page.getByRole('heading', { name: /adjust stock/i }); }
  get saveButton() { return this.page.getByRole('button', { name: /save/i }); }
  get successToast() { return this.page.getByText(/adjust.*success|success.*adjust|adjusted successfully/i); }

  async goto() {
    await this.page.goto(this.url);
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
  }

  async searchProduct(query: string) {
    await this.searchInput.fill(query);
    await expect(this.tableRows.first()).toBeVisible({ timeout: 8_000 });
  }

  async adjustFirstStock(quantity: number, type: string, reason: string) {
    await expect(this.adjustButton).toBeVisible({ timeout: 10_000 });
    await this.adjustButton.click();
    await expect(this.adjustModalHeading).toBeVisible({ timeout: 5_000 });
    await this.page.locator('input[type="number"]').fill(String(quantity));
    await this.page.locator('select').selectOption(type);
    await this.page
      .locator('input[placeholder*="Physical audit" i], input[placeholder*="audit" i]')
      .fill(reason);
    await this.saveButton.click();
  }
}
