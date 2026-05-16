/**
 * Auth Helper — login and logout utilities for tests.
 *
 * FIND-016: JWT is now an HttpOnly cookie set by the server.
 * - Browser-based tests (page.*): cookie is stored automatically by the browser context.
 * - API-direct tests (fetch/apiRequest): use the Bearer token returned in the login
 *   response body (kept for backward compat; JwtStrategy accepts both).
 * - setAuthInBrowser now injects user data only (not the token) into localStorage.
 */

import type { Page } from '@playwright/test';
import { loginApi } from './api';

export interface AuthState {
  token: string;
  user: { id: string; email: string; role: string; firstName: string; lastName: string };
}

export async function loginViaApi(email: string, password: string): Promise<AuthState> {
  const res = await loginApi(email, password);
  // accessToken is returned by the API for backward compat (non-browser clients).
  // Browser clients receive the token as a Set-Cookie header instead.
  return { token: res.accessToken, user: res.user };
}

/**
 * Inject auth state into a browser page.
 * - User data goes to localStorage (for UI rendering — not sensitive).
 * - The actual JWT cookie is set by the server on the next credentialed request;
 *   for tests that need the cookie, use loginViaUi or page.request.post('/auth/login').
 */
export async function setAuthInBrowser(page: Page, auth: AuthState): Promise<void> {
  await page.goto('/');
  await page.evaluate((user) => {
    localStorage.setItem('trustcart_user', JSON.stringify(user));
    // trustcart_token intentionally NOT stored — token is an HttpOnly cookie (FIND-016)
  }, auth.user);
}

// Full login via the login page UI — browser context gets the HttpOnly cookie automatically
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
    // Fallback: clear user data (cookie is cleared server-side on next logout call)
    await page.evaluate(() => {
      localStorage.removeItem('trustcart_user');
    });
  }
}
