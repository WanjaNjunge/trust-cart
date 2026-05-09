import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly url = '/login';

  get emailInput() { return this.page.locator('input[name="email"]'); }
  get passwordInput() { return this.page.locator('input[name="password"]'); }
  get submitButton() { return this.page.getByRole('button', { name: /sign in|log in/i }); }
  get errorMessage() { return this.page.getByText(/invalid|incorrect|failed|wrong/i); }

  async goto() {
    await this.page.goto(this.url);
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.page.getByRole('button', { name: /sign in|log in|login/i }).click();
  }

  async expectError() {
    await expect(this.errorMessage).toBeVisible({ timeout: 8_000 });
  }

  async expectRedirectToAccount() {
    await expect(this.page).toHaveURL(/account/, { timeout: 20_000 });
  }
}
