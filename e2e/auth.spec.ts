import { test, expect } from '@playwright/test';
import { USERS } from './fixtures/users';
import { loginViaApi, setAuthInBrowser } from './helpers/auth';
import { apiRequest } from './helpers/api';

test.describe('Authentication', () => {
  test('register with valid data creates account', { tag: ['@regression'] }, async ({ page }) => {
    const unique = Date.now();
    await page.goto('/register');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', `e2e+${unique}@test.com`);
    await page.fill('input[name="password"]', 'Test123!Pass');
    await page.fill('input[name="confirmPassword"]', 'Test123!Pass');
    await page.click('button[type="submit"]');
    // Redirected to login with success message
    await expect(page).toHaveURL(/login/, { timeout: 10_000 });
    await expect(page.getByText(/account created|successfully/i)).toBeVisible();
  });

  test('register with duplicate email shows error', { tag: ['@regression'] }, async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', USERS.customer.email);
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Test123!');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/already|exists|taken/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('login with valid credentials redirects to account', { tag: ['@smoke', '@critical', '@regression'] }, async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', USERS.customer.email);
    await page.fill('input[name="password"]', USERS.customer.password);
    await page.click('button[type="submit"]');
    // Account page checks auth in useEffect after hydration — allow extra time
    await expect(page).toHaveURL(/account/, { timeout: 20_000 });
  });

  test('login with wrong password shows error', { tag: ['@regression'] }, async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', USERS.customer.email);
    await page.fill('input[name="password"]', 'WrongPassword99!');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/invalid|incorrect|failed|wrong/i)).toBeVisible({ timeout: 8_000 });
    await expect(page).toHaveURL(/login/);
  });

  test('/account redirects to login when not authenticated', { tag: ['@smoke', '@critical', '@regression'] }, async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });

  test('logged-in user can view their profile', { tag: ['@regression'] }, async ({ page }) => {
    const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
    await setAuthInBrowser(page, auth);
    await page.goto('/account');
    // Email is always specific to this user and rendered once profile loads
    await expect(page.getByText(USERS.customer.email)).toBeVisible({ timeout: 10_000 });
  });

  test('logged-in user can view address list', { tag: ['@regression'] }, async ({ page }) => {
    const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
    await setAuthInBrowser(page, auth);
    await page.goto('/account');
    // Address section exists (customer has seeded address)
    await expect(page.getByText(/address|delivery/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('forgot password page renders and submits', { tag: ['@regression'] }, async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('h1')).toContainText(/reset|password/i);
    await page.fill('input[name="email"]', 'unknown@example.com');
    await page.click('button[type="submit"]');
    // Always shows success (never reveals account existence)
    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({ timeout: 8_000 });
  });

  test('reset password page renders without a token', { tag: ['@regression'] }, async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.locator('h1')).toContainText(/password/i);
    // Should show error about missing/invalid token
    await expect(page.getByText(/missing|invalid|expired/i)).toBeVisible({ timeout: 8_000 });
  });

  test('reset password page renders with a token param', { tag: ['@regression'] }, async ({ page }) => {
    await page.goto('/reset-password?token=test-token-123');
    await expect(page.locator('h1')).toContainText(/password/i);
    // Form inputs are visible
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });

  test('logout clears auth and protects account page', { tag: ['@regression'] }, async ({ page }) => {
    const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
    await setAuthInBrowser(page, auth);
    // Clear auth manually (equivalent to logout)
    await page.evaluate(() => {
      localStorage.removeItem('trustcart_token');
      localStorage.removeItem('trustcart_user');
    });
    await page.goto('/account');
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });
});

// ─── FIND-003: JWT blacklist / server-side logout ────────────────────────────

test.describe('JWT logout blacklist (FIND-003)', () => {
  test('login → authenticated request OK → logout → same token rejected 401 @smoke', async () => {
    // 1. Login and obtain token
    const loginData = await apiRequest<{ accessToken: string }>(
      'POST', '/auth/login',
      { email: USERS.admin.email, password: USERS.admin.password },
    );
    const token = loginData.accessToken;
    expect(typeof token).toBe('string');

    // 2. Token works — GET /users/me returns 200
    const profileBefore = await apiRequest<{ id: string }>('GET', '/users/me', undefined, token);
    expect(typeof profileBefore.id).toBe('string');

    // 3. Logout — server blacklists the JTI in Redis
    await apiRequest('POST', '/auth/logout', {}, token);

    // 4. Same token now returns 401
    const API = 'http://localhost:3001/api/v1';
    const res = await fetch(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  test('logout with no token returns 200 gracefully', async () => {
    const result = await apiRequest<{ message: string }>('POST', '/auth/logout', {});
    expect(result.message).toMatch(/logged out/i);
  });
});
