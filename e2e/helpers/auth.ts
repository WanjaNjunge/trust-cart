/**
 * Auth Helper — login and logout utilities for tests.
 * Prefer loginViaApi + setAuthInBrowser for speed (~200ms vs 3-4s via UI).
 * Use loginViaUi / logoutViaUi only when testing the auth UI flows directly.
 */

import type { Page } from '@playwright/test';
import { loginApi } from './api';

export interface AuthState {
  token: string;
  user: { id: string; email: string; role: string; firstName: string; lastName: string };
}

export async function loginViaApi(email: string, password: string): Promise<AuthState> {
  const res = await loginApi(email, password);
  return { token: res.accessToken, user: res.user };
}

// Inject auth into browser localStorage so the app treats the browser as logged in
export async function setAuthInBrowser(page: Page, auth: AuthState): Promise<void> {
  await page.goto('/');
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('trustcart_token', token);
    localStorage.setItem('trustcart_user', JSON.stringify(user));
  }, { token: auth.token, user: auth.user });
}

// Full login via the login page UI
export async function loginViaUi(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(account|$)/, { timeout: 10_000 });
}

export async function logoutViaUi(page: Page): Promise<void> {
  await page.goto('/account');
  const logoutBtn = page.getByRole('button', { name: /logout|sign out/i });
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
  } else {
    // Clear localStorage directly
    await page.evaluate(() => {
      localStorage.removeItem('trustcart_token');
      localStorage.removeItem('trustcart_user');
    });
  }
}
