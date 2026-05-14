# Project Walkthrough Guide — TripArc Interview

---

## A. How to Open the Walkthrough (First 60 Seconds)

### Exact opening script
> "I'm going to walk you through a Playwright project I built called TrustCart Kenya — it's a B2C electronics e-commerce platform with MPesa payment integration. The reason I chose this project is that it mirrors the booking-and-payment flows I'd be testing at TripArc: multi-step checkout, asynchronous payment confirmation, price integrity validation, and role-based access control. I'll start with the folder structure so you can see how it's organised, then I'll go deep on three files that show different aspects of the framework."

### What the project does (one sentence)
> TrustCart is a production-grade e-commerce MVP for the Kenyan market — it handles product browsing, cart management, MPesa STK Push checkout, order lifecycle management, and a multi-role admin panel.

### Natural intro points
- Written in TypeScript throughout (matches TripArc's expected stack)
- Built on NestJS (API) + Next.js (frontend) + PostgreSQL — a real, complex full-stack product, not a tutorial app
- 86 automated tests across 9 spec files, running in CI via GitHub Actions
- Test suite was built from scratch, demonstrating the shift-to-automation mindset the role requires

---

## B. Folder Structure Walkthrough

### Full annotated tree — open this in the sidebar first

```
modern-ecom/
│
├── e2e/                          ← START HERE — entire Playwright suite
│   │
│   ├── fixtures/                 ← Test data and custom framework extensions
│   │   ├── users.ts              ← Seeded credentials + known product slugs (single source of truth)
│   │   ├── playwright.fixtures.ts ← Custom test.extend() — customerPage, adminPage, etc. (Phase 5)
│   │   └── test-data-factory.ts  ← Creates unique test users per run; avoids shared state
│   │
│   ├── helpers/                  ← Pure functions used across all spec files
│   │   ├── api.ts                ← Typed Node.js fetch wrappers (loginViaApi, clearCart, addToCartApi)
│   │   ├── auth.ts               ← loginViaApi + setAuthInBrowser pattern
│   │   └── db.ts                 ← Direct PostgreSQL queries for audit-trail validation (Phase 3)
│   │
│   ├── pages/                    ← Page Object Model — 7 classes
│   │   ├── BasePage.ts           ← Abstract base class with shared Page reference
│   │   ├── LoginPage.ts          ← Login form locators and actions
│   │   ├── ProductPage.ts        ← Product detail: add to cart, price, heading
│   │   ├── CartPage.ts           ← Cart: remove, promo code, proceed to checkout
│   │   ├── CheckoutPage.ts       ← Place order + wait for async payment confirmation
│   │   └── admin/
│   │       ├── AdminInventoryPage.ts ← Inventory table, adjust stock modal
│   │       └── AdminOrdersPage.ts    ← Order list, status filter, update modal
│   │
│   ├── global-setup.ts           ← Runs ONCE before all tests: health check + DB seed
│   ├── global-teardown.ts        ← Runs ONCE after all tests: removes factory test users
│   │
│   ├── customer-browsing.spec.ts ← Browse, search, product detail (read-only, no auth needed)
│   ├── auth.spec.ts              ← Register, login, forgot/reset password, logout
│   ├── shopping-flow.spec.ts     ← Cart → checkout → MPesa payment → confirmation (CRITICAL PATH)
│   ├── order-management.spec.ts  ← Order history, detail, cancellation
│   ├── admin.spec.ts             ← Dashboard, products, inventory, orders, RBAC (15 tests)
│   ├── api.spec.ts               ← API contract tests (no browser — request fixture only)
│   ├── data-validation.spec.ts   ← SQL layer: price snapshot, audit trail, FK integrity (Phase 3)
│   ├── security.spec.ts          ← IDOR, oversell prevention, role boundaries (Phase 4)
│   ├── fixtures-demo.spec.ts     ← Live demo of custom fixtures + data factory (Phase 5)
│   └── README.md                 ← Architecture overview and design decisions
│
├── playwright.config.ts          ← Config: two projects (chromium + smoke), global setup/teardown
├── .github/workflows/ci.yml      ← GitHub Actions: lint → unit tests → build → E2E smoke
└── package.json                  ← e2e, e2e:smoke, e2e:regression, e2e:ui, e2e:report scripts
```

### What to click into FIRST for maximum impact
1. `e2e/shopping-flow.spec.ts` — the critical path, shows POM + test.step()
2. `e2e/data-validation.spec.ts` — shows SQL layer, the unique differentiator
3. `e2e/fixtures/playwright.fixtures.ts` — shows framework maturity with test.extend()
4. `playwright.config.ts` — quick, clean, everything intentional

### What NOT to spend time on
- `apps/` directory (the full NestJS + Next.js application source) — not relevant
- `docs/` folder outside interview_prep — planning docs
- `packages/shared/` — shared TypeScript types
- Any migration files or Docker configs

---

## C. Playwright Config Walkthrough

### Full annotated `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // ↑ All test files live in one place — easy to find, clear boundary 
  //   between app code and test code

  timeout: 30_000,
  // ↑ 30 seconds per test. Most tests complete in 1–5 s.
  //   The checkout test overrides to 90 s (test.setTimeout) because
  //   the MPesa stub auto-confirms after 5 s and polling takes up to 36 s.
  //   Individual override is better than raising the global — it surfaces
  //   slow tests immediately.

  retries: 0,
  // ↑ DELIBERATE. Retries hide flaky tests. I want every failure
  //   to be a genuine problem that I investigate and fix. A flaky
  //   test that retries silently erodes trust in the suite.
  //   In CI: same policy. If it fails, we know.

  workers: 1,
  // ↑ Serial execution. Tests share john.doe@example.com's cart
  //   in the database. Parallel workers corrupt cart state between
  //   tests. The data factory (Phase 5) is the path to workers: 2+.

  reporter: [
    ['list'],
    // ↑ Live terminal output — each test result printed immediately.
    //   Useful for local dev and watching CI logs.

    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    // ↑ HTML report always generated, never auto-opens (CI-friendly).
    //   Uploaded as a GitHub Actions artifact — any team member can
    //   download and inspect failures without a local Playwright setup.
  ],

  use: {
    baseURL: 'http://localhost:3000',
    // ↑ All page.goto('/orders') calls resolve to localhost:3000/orders.
    //   Change one value to point at staging or production.

    headless: true,
    // ↑ No browser window — faster and CI-compatible.
    //   Toggle to false locally for debugging: npx playwright test --headed

    screenshot: 'only-on-failure',
    // ↑ Zero overhead on passing tests.
    //   On failure: screenshot attached to the HTML report automatically.
    //   No manual screenshot code in any test.

    video: 'off',
    // ↑ Saves disk space. Would enable 'retain-on-failure' in staging CI
    //   for harder-to-debug flicker issues.

    trace: 'on-first-retry',
    // ↑ Full timeline (network, DOM snapshots, console) captured if a
    //   test is retried. Since retries: 0, this is future-proofing for
    //   when retries are enabled in staging CI environments.
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
      // ↑ Full regression suite — no grep filter, all 86 tests.
      //   Run with: pnpm e2e  or  pnpm e2e:regression
    },
    {
      name: 'smoke',
      grep: /@smoke/,
      use: { browserName: 'chromium' },
      // ↑ 8 tests tagged @smoke — covers the critical path only.
      //   Completes in ~90 s. Used in CI on every PR.
      //   Run with: pnpm e2e:smoke
    },
  ],

  globalSetup: './e2e/global-setup.ts',
  // ↑ Runs ONCE before any test:
  //   1. Waits for API and web servers to be healthy
  //   2. Runs pnpm db:seed — resets inventory to 20 units, resets passwords
  //   3. Re-checks API health after seed (seed saturates DB connections briefly)

  globalTeardown: './e2e/global-teardown.ts',
  // ↑ Runs ONCE after all tests complete.
  //   Deletes factory-generated test users (email LIKE '%@trustcart-e2e.test')
  //   Keeps the DB clean across CI runs.
});
```

### 3 likely config follow-up questions

**Q: "Why retries: 0? Most teams use retries: 2 in CI."**
> Retries are a band-aid on a flaky test. If a test retries and passes, you've hidden a real problem — either the test itself is unstable, or there's a genuine application race condition you need to know about. I set flaky test rate as a KPI: any test that fails more than 2% of runs is a P1 fix. With retries, that signal disappears. Organisations I've worked in use retries for emergency situations, not as a baseline.

**Q: "Why workers: 1 instead of parallelising?"**
> The tests share john.doe@example.com's cart in PostgreSQL. If two workers simultaneously add different products to the same cart, assertions break in unpredictable ways. I documented this deliberately in the config comment. The path forward is the test data factory I built in Phase 5 — each test gets a unique user, which eliminates the shared state problem and enables parallel workers for those tests.

**Q: "You only have Chromium. Do you not test cross-browser?"**
> The config has Firefox and WebKit commented out — they're intentionally disabled because the suite was running against a dev server with limited resources. In a production CI environment, I'd enable them for the regression suite, gated on a nightly schedule rather than every PR. The smoke suite would stay Chromium-only for PR speed.

### What shows maturity in this config
- `retries: 0` with documented reasoning
- Two named projects (regression vs smoke) — shows tiered test strategy
- `globalSetup` reseeds DB — shows awareness of test isolation across runs
- `globalTeardown` cleans factory data — shows awareness of DB hygiene
- `screenshot: 'only-on-failure'` — not screenshotting everything (shows CI overhead awareness)
- `trace: 'on-first-retry'` — future-proofed, not reactive

---

## D. Test File Deep-Dives

---

### FILE 1: `e2e/shopping-flow.spec.ts`
**Purpose:** End-to-end critical path — add to cart → checkout → async payment confirmation → order confirmation page.

#### Annotated walkthrough

```typescript
// ── Imports ──────────────────────────────────────────────────────────────────
import { ProductPage } from './pages/ProductPage';    // POM usage
import { CartPage } from './pages/CartPage';           // POM usage
import { CheckoutPage } from './pages/CheckoutPage';   // POM usage
// Three POM classes covering the entire customer journey

test.describe('Shopping Flow', () => {

  // ── Shared auth state (not per-test login form) ───────────────────────────
  let auth: { token: string; user: { ... } };

  test.beforeEach(async ({ page }) => {
    auth = await loginViaApi(...);     // ~200 ms via API, not ~3 s via UI form
    await clearCart(auth.token);       // Isolation: clean slate before every test
    await setAuthInBrowser(page, auth); // Injects JWT into localStorage
  });
  // WHY: clearCart prevents test order from inheriting stale items.
  // WHY: loginViaApi bypasses the login form — auth is tested in auth.spec.ts.

  // ── Test 1: Add to Cart (uses POM) ────────────────────────────────────────
  test('add product to cart...', async ({ page }) => {
    const productPage = new ProductPage(page);
    await productPage.goto(SLUGS.product);     // /products/hp-elitebook-840-g6
    await productPage.addToCart();             // Clicks button + waits for confirmation
  });
  // WHAT THIS PROVES: POM usage, single-responsibility actions

  // ── Test 2: Cart page (API seeding + POM assertion) ───────────────────────
  test('cart page shows added items...', async ({ page }) => {
    await addToCartApi(auth.token, SLUGS.product); // Seed via API — faster, no UI
    const cartPage = new CartPage(page);
    await cartPage.goto();
    await cartPage.expectItem(/HP EliteBook/i);    // POM encapsulates assertion
    await expect(cartPage.checkoutLink).toBeVisible();
  });
  // WHY API seed: UI interaction to add product would be a pre-condition,
  // not the thing being tested. API seeding is faster and more stable.

  // ── Test 3: Remove item (modal confirmation) ──────────────────────────────
  test('removing item from cart...', async ({ page }) => {
    await addToCartApi(auth.token, SLUGS.product);
    const cartPage = new CartPage(page);
    await cartPage.goto();
    await cartPage.removeFirstItem(); // Handles "Remove" button + modal confirm
    await expect(page.getByText(/HP EliteBook/i)).not.toBeVisible({ timeout: 8_000 });
  });
  // WHAT THIS PROVES: negative assertion + modal interaction encapsulated in POM

  // ── Test 5: Full checkout (THE most important test) ───────────────────────
  test('full checkout flow...', { tag: ['@critical', '@regression'] }, async ({ page }) => {
    test.setTimeout(90_000); // Override for async payment stub (5 s delay + 36 s polling)

    await test.step('seed cart via API', async () => {      // Step 1
      await addToCartApi(auth.token, SLUGS.product);
    });

    await test.step('navigate to checkout', async () => {   // Step 2
      await cartPage.goto();
      await cartPage.proceedToCheckout();
    });

    await test.step('place order (MPesa STK stub)', async () => { // Step 3
      await checkoutPage.placeOrder();
    });

    await test.step('confirm order', async () => {           // Step 4
      await checkoutPage.waitForOrderConfirmation(); // Polls GET /payments/:id every 3 s
      await expect(checkoutPage.viewOrderLink).toBeVisible();
    });
  });
  // WHY test.step(): Each step appears independently in the HTML report.
  // If step 3 fails, you know it's the place-order click, not the navigation.
  // WHY @critical not @smoke: 90 s stub delay makes it too slow for every PR.
  // It runs in regression + the @critical suite.
```

#### What this test proves about your skills
- Multi-step flow management with `test.step()` for report clarity
- Hybrid approach: API-seed pre-conditions, UI for the actual flow
- POM usage across three page objects in one test
- Async payment handling (polling, not just sleeping)
- Tag strategy: different tags serve different CI triggers

#### Likely follow-up questions

**Q: "Why did you tag the checkout test @critical but not @smoke?"**
> The MPesa stub auto-confirms after 5 seconds. My polling loop runs every 3 seconds for up to 36 seconds. That means the checkout test takes at minimum ~8 seconds just for the payment leg. The full test is reliably 30–40 seconds. A smoke suite should complete in under 90 seconds total — adding a 40-second test would breach that. The @critical tag means it runs in the full regression suite and in any explicit critical-only run before a release.

**Q: "What is test.step() and why did you use it here?"**
> test.step() groups actions into named steps that appear as labelled sections in the HTML report. Without it, a failure at step 3 shows "checkout test failed at line 74" — you have to read the code to understand where in the flow it broke. With it, the report shows "❌ place order (MPesa STK stub) failed" — instantly clear. In a team context, this matters when developers or PMs are reading CI reports, not just the QA engineer.

**Q: "Why do you seed the cart via API instead of using the UI?"**
> Adding a product to the cart via the UI would involve navigating to a product page, waiting for it to load, clicking "Add to Cart", and waiting for confirmation — that's 3–5 seconds of test setup that isn't what this test is testing. Using `addToCartApi` completes the same state change in ~200 ms. The UI for adding to cart is already tested in the first test in this same file. Pre-conditions that aren't the subject of the test should be fast and silent.

---

### FILE 2: `e2e/data-validation.spec.ts`
**Purpose:** SQL-layer audit trail validation — verifies that API operations produce correct database state, not just correct UI responses.

#### Annotated walkthrough

```typescript
// This file has NO browser (no { page } fixture).
// It uses: loginViaApi, apiRequest, and direct SQL queries via helpers/db.ts

import { getOrderItems, getOrderStatusHistory, getStockAdjustments,
         getInventoryRecord, getProductPrice } from './helpers/db';
// ↑ Each function runs a raw SQL query against PostgreSQL directly.
//   No ORM, no API call — reads the database as the source of truth.

test.afterAll(async () => {
  await closeDb();
  // ↑ Closes the pg Pool after all tests in this file. Without this,
  //   Node.js would not exit cleanly.
});

// ── Price Snapshot Test ───────────────────────────────────────────────────────
test('checkout captures product price into order_items at time of order', async () => {
  const priceBeforeOrder = await getProductPrice(SLUGS.product);
  // SELECT price FROM products WHERE slug = 'hp-elitebook-840-g6' → returns 45990

  const { order } = await placeTestOrder(); // Creates real order via API

  const items = await getOrderItems(order.orderNumber);
  // SELECT oi.unit_price FROM order_items oi JOIN orders o ...

  expect(items[0].unit_price).toBe(priceBeforeOrder);
  // ↑ THE KEY ASSERTION: price in order_items must equal the live product price
  //   at checkout time. If someone changes the product price after the order,
  //   this test would still pass — because it captured the price at order time.
  //   This is the "fare lock" in travel: price shown = price charged.

  expect(items[0].line_total).toBe(items[0].unit_price * items[0].quantity);
  // ↑ No rounding errors. Quantity × unit price must equal stored line total.
});

// ── Order Status History Audit Trail ─────────────────────────────────────────
test('checkout writes PENDING_PAYMENT history entry with correct metadata', async () => {
  const { order } = await placeTestOrder();

  const history = await getOrderStatusHistory(order.orderNumber);
  // SELECT from_status, to_status, changed_by_type, reason FROM order_status_history ...

  expect(history[0].from_status).toBeNull();          // First entry: no previous state
  expect(history[0].to_status).toBe('PENDING_PAYMENT');
  expect(history[0].changed_by_type).toBe('CUSTOMER'); // Correctly attributed
  // ↑ The UI shows a status badge. This SQL query proves the AUDIT RECORD exists.
  //   A UI test alone can't verify this.
});

// ── StockAdjustment Audit Trail ───────────────────────────────────────────────
test('inventory adjust creates StockAdjustment record with correct fields', async () => {
  const countBefore = (await getStockAdjustments(product.sku)).length;

  await apiRequest('PATCH', `/admin/inventory/${product.id}/adjust`, {
    quantity: 3,
    adjustmentType: 'CORRECTION',
    reason: 'SQL validation test',
    reference: 'TEST-REF-DB-001',
  }, adminAuth.token);

  const adjustments = await getStockAdjustments(product.sku);
  expect(adjustments.length).toBe(countBefore + 1);
  expect(adjustments[0].reference_id).toBe('TEST-REF-DB-001');
  // ↑ The UI shows a toast message. This query proves the audit record persisted
  //   with the exact reference ID — verifiable if an audit request comes in.
});
```

#### What this test file proves about your skills
- SQL knowledge applied directly to test validation
- Understanding that the UI is not the authoritative source of truth
- Audit trail testing — critical in regulated environments (fintech, travel)
- The "price-lock" concept maps directly to fare-lock in travel booking
- No browser needed — faster, more focused than UI tests

#### Likely follow-up questions

**Q: "Why test the database directly? Isn't that what integration tests are for?"**
> UI tests can only verify what's visible. They can't confirm the `changed_by_type` field in the status history, or that `reference_id` was persisted exactly as passed. For audit trails — which are critical in travel booking for dispute resolution, chargebacks, and compliance — the only authoritative source is the database. I treat it as a separate testing layer: UI tests for user-facing correctness, SQL tests for data integrity.

**Q: "How do you connect directly to the database in tests?"**
> I use the `pg` library (node-postgres) with a connection pool pointing at the same `DATABASE_URL` the application uses. The helper functions in `helpers/db.ts` are simple parameterised query wrappers — no ORM, which keeps the queries transparent and easy to read. The pool is closed in `afterAll` to allow clean process exit.

---

### FILE 3: `e2e/security.spec.ts`
**Purpose:** API-level security and boundary validation — IDOR prevention, stock oversell protection, role-based access control enforcement at the API layer.

#### Annotated walkthrough

```typescript
// ── IDOR Prevention ───────────────────────────────────────────────────────────
test('Customer B cannot read Customer A order by ID — returns 403', async () => {
  // Customer A places an order
  const authA = await loginViaApi(USERS.customer.email, ...);
  const orderA = await createOrder(authA.token, addrsA[0].id);

  // Customer B tries to access it by guessing the order ID
  const authB = await loginViaApi(USERS.customer2.email, ...);
  const res = await fetch(`${API}/orders/${orderA.id}`, {
    headers: { Authorization: `Bearer ${authB.token}` },
  });

  expect(res.status).toBe(403);
  // ↑ IDOR = Insecure Direct Object Reference. The #1 most common API
  //   vulnerability. Customer B guesses or intercepts the order UUID.
  //   The ownership check in the API must reject it with 403, not expose
  //   the order data.
});

// ── Oversell Prevention ───────────────────────────────────────────────────────
test('adding quantity exceeding stock returns 409 INSUFFICIENT_STOCK', async () => {
  const res = await fetch(`${API}/cart/items`, {
    method: 'POST',
    body: JSON.stringify({ productId: product.id, quantity: 99999 }),
    // ↑ The UI would cap this via a UI input max. A malicious actor
    //   bypasses the UI and calls the API directly. The API MUST reject it.
  });

  expect(res.status).toBe(409);
  const body = await res.json();
  expect(body.message).toMatch(/insufficient.stock/i);
  // ↑ Two assertions: status code AND error message. A 409 with a different
  //   body (e.g., a conflict on a different resource) would still fail the test.
});

// ── Role Boundary: Refund ─────────────────────────────────────────────────────
test('STAFF cannot initiate a refund — returns 403', async () => {
  // Set up a confirmed order (required state for refund)
  // ...
  const res = await fetch(`${API}/admin/orders/${order.id}/refund`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffAuth.token}` },
    body: JSON.stringify({ amount: 1000, reason: 'Attempting refund' }),
  });
  expect(res.status).toBe(403);
  // ↑ Not 200 (allowed), not 404 (not found) — specifically 403 (forbidden).
  //   The test verifies the RBAC check fires EVEN when the endpoint and data are correct.
});

// ── CUSTOMER bulk RBAC check ──────────────────────────────────────────────────
test('CUSTOMER cannot access any admin endpoint — returns 403', async () => {
  const adminEndpoints = [
    { method: 'GET', path: '/admin/inventory' },
    { method: 'GET', path: '/admin/orders' },
    { method: 'GET', path: '/admin/products' },
    { method: 'GET', path: '/admin/stats' },
  ];
  for (const { method, path } of adminEndpoints) {
    const res = await fetch(`${API}${path}`, { ... });
    expect(res.status, `Expected 403 on ${method} ${path}`).toBe(200);
    // ↑ Loop with a custom message — if one endpoint fails, the error says
    //   exactly WHICH endpoint: "Expected 403 on GET /admin/stats".
    //   Without the message, you'd just see "Expected 200, received 403"
    //   and have to guess which iteration failed.
  }
});
```

#### What this test file proves about your skills
- Security-minded testing approach (OWASP Top 10 awareness)
- Boundary testing (above limit, at limit — both covered)
- RBAC tested at API layer, not just UI layer
- Informative assertion messages in loop scenarios
- No browser required — pure HTTP contract testing

#### Likely follow-up questions

**Q: "What is IDOR and why is it relevant for a travel booking platform?"**
> IDOR (Insecure Direct Object Reference) is when a user can access another user's data by changing an ID in a request. In a travel booking platform, this is critical: a customer could potentially access another customer's booking details, PII, or payment information by guessing a booking ID. In TripArc's context with 48,000 clients and ~$884 million in annual booking volume, an IDOR vulnerability is a compliance failure, not just a bug.

**Q: "Why test at the API level for role enforcement? Isn't the UI enough?"**
> A hidden button in the UI doesn't prevent an attacker from calling the API directly. RBAC must be enforced server-side. The UI hiding a "Refund" button for Staff users is a UX feature. The API returning 403 for a direct POST to `/admin/orders/:id/refund` is the actual security control. I test both: the UI tests verify the button isn't visible, the security tests verify the API rejects the call regardless.

---

## E. Page Objects Folder Breakdown

### How to introduce POM during the walkthrough
> "You'll see I've used the Page Object Model throughout. Each file in the `pages/` folder models one page or section of the application — it defines locators as getters (not in the constructor) and actions as methods. The key design choice I'll explain is why getters instead of constructor assignment."

### Design philosophy: lazy `get` properties

```typescript
// ❌ CONSTRUCTOR APPROACH — stale element risk
constructor(page: Page) {
  this.placeOrderButton = page.getByRole('button', { name: /place order/i });
  // Captured once at instantiation — if the DOM changes after navigation,
  // this reference becomes stale and interactions fail unpredictably
}

// ✅ GETTER APPROACH — always fresh
get placeOrderButton() {
  return this.page.getByRole('button', { name: /place order/i });
  // Re-evaluated on every access against the CURRENT DOM state
  // Navigation, re-renders, dynamic content — no stale references
}
```

### Page-by-page breakdown

**`BasePage.ts`**
- Models: shared foundation
- Exposes: `protected readonly page: Page`
- Why: single constructor call for all subclasses; typed `page` reference
- Interview point: abstract class enforces the pattern without being prescriptive

**`LoginPage.ts`**
- Models: `/login` page
- Locators: emailInput (by name attr), passwordInput, submitButton (by role), errorMessage
- Actions: `login(email, password)`, `expectError()`, `expectRedirectToAccount()`
- Decision: `expectRedirectToAccount()` encapsulates the 20s timeout — tests don't repeat that knowledge

**`ProductPage.ts`**
- Models: `/products/:slug`
- Locators: heading (h1), priceLabel (by text with KES pattern), addToCartButton (by role), addedConfirmation
- Actions: `goto(slug)`, `addToCart()` — waits for confirmation before returning
- Decision: `addToCart()` includes the assertion that it worked — callers don't need to know the confirmation text

**`CartPage.ts`**
- Models: `/cart`
- Locators: checkoutLink, promoInput (by placeholder), applyPromoButton, promoError
- Actions: `goto()`, `expectItem(pattern)`, `removeFirstItem()` (handles the confirmation modal internally), `applyPromoCode(code)`, `proceedToCheckout()`
- Decision: `removeFirstItem()` encapsulates the two-step modal flow — the test only sees `removeFirstItem()`, not the modal implementation detail

**`CheckoutPage.ts`**
- Models: checkout and order-confirmation pages
- Locators: placeOrderButton, confirmationHeading, viewOrderLink, continueShoppingLink
- Actions: `placeOrder()` (click + wait for button visible), `waitForOrderConfirmation()` (waits for URL change + heading, 60s timeout)
- Decision: timeout of 60s lives in the POM, not in the test — if the payment flow changes, one file changes, not every test

**`admin/AdminInventoryPage.ts`**
- Models: `/admin/inventory`
- Locators: heading (by role), tableRows, searchInput, adjustButton, adjustModalHeading, saveButton, successToast
- Actions: `goto()` (waits for heading), `searchProduct(query)`, `adjustFirstStock(quantity, type, reason)`
- Decision: `goto()` includes `await expect(heading).toBeVisible()` — tests call `goto()` and can immediately interact without extra waits

**`admin/AdminOrdersPage.ts`**
- Models: `/admin/orders`
- Locators: heading, tableRows, statusFilter, updateButton, updateStatusHeading, updateStatusButton, successMessage
- Actions: `goto()`, `filterByStatus(status)`, `searchByOrderNumber(orderNumber)`, `updateFirstOrderStatus(newStatus, reason)`
- Decision: `filterByStatus` waits for networkidle — a debounced API call fires after the select changes; the page object handles that, not the test

### Connecting POM to tests during walkthrough
> "Here's how these connect: in `shopping-flow.spec.ts`, line 20, you see `const productPage = new ProductPage(page)`. I pass the `page` fixture from Playwright to the constructor. Then I call `productPage.goto(SLUGS.product)` and `productPage.addToCart()` — two clear intent-expressing lines. If the product page UI changes, I update `ProductPage.ts` once and every test that uses it is fixed."
