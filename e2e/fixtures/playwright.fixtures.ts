/**
 * Custom Playwright Fixtures — Phase 5
 *
 * Extends Playwright's base `test` with pre-authenticated page and auth state
 * fixtures for every role in the system.
 *
 * WHY: Every test that needs an authenticated user currently has 3–4 lines of
 * boilerplate in beforeEach (loginViaApi → setAuthInBrowser). Custom fixtures
 * push that into the framework, so test intent is clear from the signature:
 *
 *   test('admin sees dashboard', async ({ adminPage }) => { ... })
 *   test('customer sees orders', async ({ customerPage }) => { ... })
 *
 * HOW — locators are not assigned in the constructor (stale element risk).
 * The page fixture is a Page instance with auth already injected into
 * localStorage. No UI login form is touched — loginViaApi + evaluate is
 * ~200 ms vs ~3–4 s through the form.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/playwright.fixtures';
 *
 *   test('my test', async ({ customerPage, customerAuth }) => {
 *     await customerPage.goto('/orders');
 *     // customerAuth.token is available for API calls in the same test
 *   });
 */
import { test as base, type Page } from '@playwright/test';
import { USERS } from './users';
import { loginViaApi } from '../helpers/auth';

export interface AuthState {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

interface TrustCartFixtures {
  /** Fresh auth state for the default customer (john.doe) */
  customerAuth: AuthState;
  /** Fresh auth state for the admin user */
  adminAuth: AuthState;
  /** Browser page pre-authenticated as the default customer */
  customerPage: Page;
  /** Browser page pre-authenticated as admin */
  adminPage: Page;
  /** Browser page pre-authenticated as staff */
  staffPage: Page;
  /** Browser page pre-authenticated as manager */
  managerPage: Page;
}

async function injectAuth(page: Page, auth: AuthState): Promise<void> {
  // Navigate to root to establish same-origin localStorage scope,
  // then inject the token without touching the login form.
  await page.goto('/');
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('trustcart_token', token);
      localStorage.setItem('trustcart_user', JSON.stringify(user));
    },
    { token: auth.token, user: auth.user },
  );
}

export const test = base.extend<TrustCartFixtures>({
  // ── Auth state fixtures (token only, no browser) ───────────────────────────

  customerAuth: async ({}, use) => {
    const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
    await use(auth);
  },

  adminAuth: async ({}, use) => {
    const auth = await loginViaApi(USERS.admin.email, USERS.admin.password);
    await use(auth);
  },

  // ── Authenticated page fixtures ────────────────────────────────────────────

  customerPage: async ({ page, customerAuth }, use) => {
    await injectAuth(page, customerAuth);
    await use(page);
  },

  adminPage: async ({ page, adminAuth }, use) => {
    await injectAuth(page, adminAuth);
    await use(page);
  },

  staffPage: async ({ page }, use) => {
    const auth = await loginViaApi(USERS.staff.email, USERS.staff.password);
    await injectAuth(page, auth);
    await use(page);
  },

  managerPage: async ({ page }, use) => {
    const auth = await loginViaApi(USERS.manager.email, USERS.manager.password);
    await injectAuth(page, auth);
    await use(page);
  },
});

// Re-export expect so consumers only need one import
export { expect } from '@playwright/test';
