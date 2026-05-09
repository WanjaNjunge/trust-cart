/**
 * API-layer tests using Playwright's built-in request context.
 * These run against the live NestJS API (localhost:3001) and validate
 * status codes, response shapes, and access control — without a browser.
 */
import { test, expect } from '@playwright/test';
import { USERS, SLUGS } from './fixtures/users';
import { loginViaApi } from './helpers/auth';

const API = 'http://localhost:3001/api/v1';

// ─── Auth ─────────────────────────────────────────────────────────────────────

test.describe('API: Auth', () => {
  // FIX 1: POST /auth/login returns 200 (OK), not 201 (Created).
  // 201 is for resource-creation endpoints like POST /auth/register.
  test('POST /auth/login — valid credentials returns token and user', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: USERS.customer.email, password: USERS.customer.password },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.accessToken).toBe('string');
    expect(body.user.email).toBe(USERS.customer.email);
    expect(body.user.role).toBe('CUSTOMER');
  });

  test('POST /auth/login — wrong password returns 401', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: USERS.customer.email, password: 'WrongPass999!' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /auth/login — unknown email returns 401', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: 'nobody@nowhere.com', password: 'Whatever1!' },
    });
    expect(res.status()).toBe(401);
  });
});

// ─── Products ─────────────────────────────────────────────────────────────────

test.describe('API: Products', () => {
  // FIX 2: The API returns { data, pagination } — not { data, meta }.
  // FIX 2b: The count field is `totalItems`, not `total`.
  test('GET /products — returns paginated list with pagination object', async ({ request }) => {
    const res = await request.get(`${API}/products`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('pagination');
    expect(typeof body.pagination.totalItems).toBe('number');
  });

  // FIX 3: The product API serialises inventory as computed fields (isInStock,
  // availableQuantity), not the raw Prisma inventoryRecord relation object.
  test('GET /products/slug/:slug — returns product with stock info', async ({ request }) => {
    const res = await request.get(`${API}/products/slug/${SLUGS.product}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.slug).toBe(SLUGS.product);
    expect(typeof body.price).toBe('number');
    expect(body).toHaveProperty('isInStock');
    expect(body).toHaveProperty('availableQuantity');
    expect(typeof body.availableQuantity).toBe('number');
  });

  test('GET /products/slug/nonexistent — returns 404', async ({ request }) => {
    const res = await request.get(`${API}/products/slug/this-does-not-exist-xyz`);
    expect(res.status()).toBe(404);
  });

  // FIX 4: The search query param is `q`, not `search`.
  // The global ValidationPipe has forbidNonWhitelisted: true — unknown params cause 400.
  test('GET /products?q=laptop — filters results by search term', async ({ request }) => {
    const res = await request.get(`${API}/products?q=laptop`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });
});

// ─── Cart ─────────────────────────────────────────────────────────────────────

test.describe('API: Cart', () => {
  let token: string;

  test.beforeAll(async () => {
    // Use the shared loginViaApi helper (Node.js fetch) — same pattern as all other spec files
    const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
    token = auth.token;
  });

  test('GET /cart — authenticated request returns cart with items array', async ({ request }) => {
    const res = await request.get(`${API}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  // FIX 5: Cart uses OptionalJwtAuthGuard — unauthenticated requests are allowed
  // and return a guest cart (200), not 401. The cart is guest-friendly by design.
  // To test a hard 401, use an endpoint with JwtAuthGuard, e.g. GET /orders or GET /users/me.
  test('GET /cart — unauthenticated request returns guest cart (200)', async ({ request }) => {
    const res = await request.get(`${API}/cart`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test('GET /users/me — returns 401 without token (strict auth guard)', async ({ request }) => {
    const res = await request.get(`${API}/users/me`);
    expect(res.status()).toBe(401);
  });
});

// ─── Admin role-based access ──────────────────────────────────────────────────

test.describe('API: Admin access control', () => {
  let adminToken: string;
  let customerToken: string;

  // FIX 6: Use loginViaApi (Node.js fetch) instead of the Playwright request fixture.
  // The request fixture in beforeAll creates a separate APIRequestContext from the one
  // in individual tests. Tokens obtained via the fixture's session may behave differently
  // when passed to a different request context. Using the shared Node.js fetch helper
  // (proven across all other spec files) eliminates this scoping ambiguity entirely.
  test.beforeAll(async () => {
    const [adminAuth, customerAuth] = await Promise.all([
      loginViaApi(USERS.admin.email, USERS.admin.password),
      loginViaApi(USERS.customer.email, USERS.customer.password),
    ]);
    adminToken = adminAuth.token;
    customerToken = customerAuth.token;
  });

  test('GET /admin/inventory — accessible to ADMIN', async ({ request }) => {
    const res = await request.get(`${API}/admin/inventory`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
  });

  test('GET /admin/inventory — returns 403 for CUSTOMER', async ({ request }) => {
    const res = await request.get(`${API}/admin/inventory`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('GET /admin/orders — returns 401 without token', async ({ request }) => {
    const res = await request.get(`${API}/admin/orders`);
    expect(res.status()).toBe(401);
  });

  test('GET /admin/orders — accessible to ADMIN', async ({ request }) => {
    const res = await request.get(`${API}/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
  });
});
