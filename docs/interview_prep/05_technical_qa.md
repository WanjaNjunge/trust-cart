# Technical Questions — Answers (Point Form)
## TripArc QA Automation Engineer Interview

---

## PLAYWRIGHT / TYPESCRIPT

### What is the difference between page.locator() and page.getByRole()?

**`page.locator()`**
- Generic CSS/XPath selector: `page.locator('input[name="email"]')` or `page.locator('.btn-primary')`
- Flexible — can target any DOM element by any attribute
- Fragile when targeting by class names or position — breaks if CSS changes
- Use when semantic locators don't apply (e.g., a custom web component with no ARIA role)

**`page.getByRole()`**
- Semantic locator based on ARIA role and accessible name: `page.getByRole('button', { name: /place order/i })`
- Resilient to CSS/layout changes — the role and name don't change when you restyle
- Tests what a user and a screen reader actually see — aligns with accessibility standards
- Preferred for interactive elements (buttons, links, inputs, headings)

**Rule of thumb:**
- `getByRole` first for anything interactive
- `getByLabel` for form fields with labels
- `getByText` for static content assertions
- `page.locator()` as a last resort, always with a non-CSS selector (by `name` attribute, `data-testid`, or `aria-*`)

**In my project:**
- `CheckoutPage.ts`: `this.page.getByRole('button', { name: /place order/i })` — survives button text changes from "Place Order" to "Confirm Booking"
- `CartPage.ts`: `this.page.getByRole('link', { name: /proceed to checkout/i })` — semantic, accessible

---

### How does Playwright's auto-waiting work and what are its limits?

**How it works:**
- Every action (click, fill, check) automatically waits for the element to be: attached to DOM, visible, stable (not moving), enabled, and not obscured
- Assertions (`expect(locator).toBeVisible()`) retry until the condition is met or timeout expires
- Network requests triggered by actions are NOT automatically awaited unless you use `waitForResponse` or `waitForNavigation`

**Limits:**
- Auto-wait covers element state — not application state. If data loads asynchronously after the element appears, the element is visible but empty
- Does not wait for animations to complete — use `{ timeout: X }` or CSS `animation: none` in test environments
- Does not wait for debounced events — if a search input has a 500ms debounce, the element is ready but the API call hasn't fired yet
  - Fix: `await expect(rows.first()).toContainText(/hp/i, { timeout: 8_000 })` — polls until the content changes

**In my project:**
- Admin products search test previously failed because `rows.first().toBeVisible()` passed on the stale (unfiltered) row
- Fixed by changing to `rows.first().toContainText(/hp/i, { timeout: 8_000 })` — this polls until the debounced filter produces the expected content

---

### When would you use waitForResponse vs waitForLoadState?

**`waitForResponse`:**
- Use when you need to wait for a specific API call to complete
- Example: after clicking "Search", wait for the flight search API response before asserting results
- `await page.waitForResponse(resp => resp.url().includes('/api/flights/search') && resp.status() === 200)`
- Also useful for intercepting and inspecting the response body

**`waitForLoadState`:**
- Use when you need the page to finish loading to a specific state
- `'load'` — fires when the `load` event fires (all resources loaded)
- `'domcontentloaded'` — DOM parsed, scripts may still be running
- `'networkidle'` — no network requests for 500ms (use carefully — can be slow or fail if there are polling requests)
- Example: after navigation, wait for `domcontentloaded` before interacting with the DOM

**Practical guidance:**
- Prefer `waitForResponse` for dynamic content loaded by API calls — it's explicit about what you're waiting for
- Use `waitForLoadState('domcontentloaded')` after `goto()` if you need the DOM before API calls complete
- Avoid `networkidle` in test suites with polling or WebSocket connections — the idle state may never be reached

---

### How do you implement Page Object Model in Playwright with TypeScript?

```typescript
// BasePage.ts — shared constructor
import type { Page } from '@playwright/test';
export abstract class BasePage {
  constructor(protected readonly page: Page) {}
}

// CartPage.ts — specific page
import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  // Lazy getters — re-evaluated on every access (no stale element risk)
  get checkoutLink() {
    return this.page.getByRole('link', { name: /proceed to checkout/i });
  }
  get promoInput() {
    return this.page.locator('input[placeholder="Promo code"]');
  }

  // Actions encapsulate multi-step interactions
  async removeFirstItem() {
    await this.page.getByRole('button', { name: /remove/i }).first().click();
    const modal = this.page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await modal.getByRole('button', { name: /remove/i }).click();
    // ↑ The modal interaction is hidden from callers
  }
}

// In a test:
const cartPage = new CartPage(page);
await cartPage.goto();
await cartPage.removeFirstItem();
```

**Key design decisions:**
- `get` properties instead of constructor assignment — prevents stale element references after navigation
- Actions include their own assertions (e.g., `placeOrder()` waits for the button to be visible before clicking)
- `goto()` methods include a readiness check — `await expect(this.heading).toBeVisible()` before returning

---

### How do you handle authentication state across tests without logging in every time?

**Method 1 — loginViaApi + setAuthInBrowser (used in this project):**
```typescript
// helpers/auth.ts
export async function loginViaApi(email, password): Promise<AuthState> {
  const res = await loginApi(email, password); // Node.js fetch — ~200 ms
  return { token: res.accessToken, user: res.user };
}

export async function setAuthInBrowser(page, auth): Promise<void> {
  await page.goto('/');
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('trustcart_token', token);
    localStorage.setItem('trustcart_user', JSON.stringify(user));
  }, { token: auth.token, user: auth.user });
}
```
- Bypasses the login form entirely (~200 ms vs 3–4 s)
- Auth is tested separately in auth.spec.ts — no need to test it in every suite

**Method 2 — Playwright storageState (for complex auth flows):**
```typescript
// global.setup.ts
const page = await browser.newPage();
await page.goto('/login');
await page.fill('#email', 'admin@example.com');
await page.fill('#password', 'password');
await page.click('button[type=submit]');
await page.context().storageState({ path: 'auth.json' });

// playwright.config.ts
use: { storageState: 'auth.json' }
```
- Works for cookie-based auth or SSO flows
- Generates a snapshot of all cookies, localStorage, sessionStorage

**Method 3 — Custom fixtures (Phase 5 of this project):**
```typescript
export const test = base.extend<{ customerPage: Page }>({
  customerPage: async ({ page }, use) => {
    const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
    await injectAuth(page, auth);
    await use(page);
  },
});
// Usage: test('...', async ({ customerPage }) => { ... })
```

---

### What is the request fixture and how do you use it for API testing?

- The `request` fixture is a Playwright-provided `APIRequestContext` — an HTTP client that can make requests without a browser
- Available as a fixture in any test: `async ({ request }) => { ... }`

```typescript
// api.spec.ts — no browser, no page, just HTTP
test('POST /auth/login returns 200', async ({ request }) => {
  const res = await request.post('http://localhost:3001/api/v1/auth/login', {
    data: { email: 'admin@trustcart.co.ke', password: 'Test123!' },
  });
  expect(res.status()).toBe(200);  // Note: res.status() — not res.status
  const body = await res.json();
  expect(typeof body.accessToken).toBe('string');
});
```

**Key differences from Node.js `fetch`:**
- `res.status()` is a method call (not a property) — different from native `fetch`
- Automatically follows redirects
- Can send multipart/form-data, file uploads
- Shares baseURL from playwright.config.ts if configured

**When I use Node.js `fetch` directly instead:**
- In `beforeAll` for auth tokens — avoids a scoping issue on Windows where the Playwright `request` fixture in `beforeAll` creates a separate `APIRequestContext` that can cause libuv handle conflicts on some Windows configurations
- For the admin API calls in my `api.spec.ts` that use the browser page's `page.evaluate` to make requests from the browser context

---

### How do you intercept and mock a network request in Playwright?

```typescript
// Intercept and mock
await page.route('**/api/flights/search', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ flights: [...mockFlights] }),
  });
});

// Intercept and modify
await page.route('**/api/payments/initiate', async route => {
  const response = await route.fetch(); // Get real response
  const body = await response.json();
  body.status = 'FAILED';              // Modify it
  route.fulfill({ response, body: JSON.stringify(body) });
});

// Abort a request (test network error handling)
await page.route('**/api/availability', route => route.abort());
```

**When to use mocking:**
- Testing error states (service returns 500, network timeout) — hard to reproduce against a real backend
- Isolating the UI layer from backend availability issues
- Speeding up tests that don't need the full backend (unit-like UI tests)

**When NOT to mock:**
- Integration and E2E tests that verify the full stack — mocking defeats the purpose
- Contract tests — you want the real API to respond

**In my project:** I don't mock — all tests run against the real NestJS backend. The MPesa payment is a stub in the application itself (not mocked by Playwright), which is more realistic than mocking at the network level.

---

### How do you run tests in parallel and what are the gotchas?

**Configuration:**
```typescript
// playwright.config.ts
workers: process.env.CI ? 2 : 4,
// ↑ More workers locally, conservative in CI to avoid resource contention
```

**Gotchas:**
- **Shared database state**: two workers adding to the same user's cart simultaneously causes race conditions — use isolated users per worker (data factory pattern)
- **Test interdependency**: if test B relies on data created by test A, parallelism breaks it — every test must set up its own pre-conditions
- **Port conflicts**: if tests launch local servers, each worker needs its own port
- **Resource limits**: CI agents have limited CPU/memory — too many workers causes timeouts
- **Sequential tests within a describe block**: `test.describe.serial` forces serialisation for a group if they share state

**In my project:** `workers: 1` because tests share `john.doe@example.com`'s cart. The data factory (Phase 5) generates unique users — once tests are migrated to use factory users, workers can increase.

---

### How do you use test.each for data-driven testing?

```typescript
// Simple array
test.each([
  ['MPESA_STK', 'MPesa payment'],
  ['POD_CASH', 'Pay on Delivery'],
])('checkout with %s payment method succeeds', async ({ page }, paymentMethod, label) => {
  // ...
  expect(page.getByText(label)).toBeVisible();
});

// Object array — more readable
test.each([
  { status: 'PENDING_PAYMENT', canCancel: true, canRefund: false },
  { status: 'CONFIRMED', canCancel: true, canRefund: false },
  { status: 'DELIVERED', canCancel: false, canRefund: true },
])('order in $status status shows correct action buttons', async ({ page }, { status, canCancel, canRefund }) => {
  // ...
});
```

**When to use it:**
- Testing the same behaviour with different valid inputs (payment methods, status transitions, user roles)
- Boundary conditions: valid/invalid dates, min/max quantities, allowed/disallowed amounts
- RBAC matrix: 4 roles × N endpoints × 2 expected outcomes (200/403)

---

### What does your playwright.config.ts typically include and why?

See `01_project_walkthrough.md Section C` for the full annotated config.

**Non-negotiables in any config I write:**
- `testDir` — explicit, never implicit
- `timeout` — set consciously, not default (30s = my standard; individual tests override upward)
- `retries: 0` — honest CI results
- `screenshot: 'only-on-failure'` — no overhead on passing tests
- `baseURL` — all `page.goto()` calls use relative paths
- `globalSetup` — at minimum for server health check; add DB seed if tests depend on data state
- Named `projects` — even if only one, it makes adding a smoke suite trivial later

---

### How do you handle dynamic content that loads asynchronously?

- **Use content-based assertions, not timing**: `await expect(page.locator('.results-list').getByText('Flight')).toBeVisible({ timeout: 10_000 })` — Playwright retries until visible or times out
- **For debounced inputs** (search with 400ms debounce): `await expect(rows.first()).toContainText(/expected/i, { timeout: 8_000 })` — retries on content, not just visibility
- **For API-triggered content**: `await page.waitForResponse(url => url.includes('/search'))` — wait for the specific API call that populates the data
- **For loading spinners**: don't wait for the spinner to disappear; wait for the content to appear — they're often different assertions

**Pattern I avoid:** `await page.waitForTimeout(2000)` — arbitrary sleeps are brittle and slow. Every timing issue has a condition-based alternative.

---

### What reporters do you use and why?

**`list` reporter:**
- Real-time terminal output: each test result printed as it runs
- Essential for local dev — you see failures immediately without opening a report

**`html` reporter:**
- Full interactive report: test results, screenshots, traces, step-by-step breakdown
- Uploaded as a CI artifact — team inspects failures without local setup
- The "Retry" tab shows which tests were retried (with `retries > 0`)
- `open: 'never'` — doesn't auto-open in CI

**For larger teams I'd add:**
- `junit` — for integration with Azure DevOps or Jenkins test result dashboards
- `allure` — richer reporting with test suite history, flaky test tracking, and trend analysis

---

## QUESTIONS ARISING FROM THE PROJECT WALKTHROUGH

### Q: Why `retries: 0` when the standard is at least `retries: 1` in CI?

- Retries hide flaky tests — a retried pass is a hidden fail
- With retries enabled, a flaky test can fail 49% of the time and CI never blocks
- My policy: a test that fails is a problem to fix, not a problem to suppress
- I track flaky rate as a KPI — retries would make that metric invisible
- The correct fix for a flaky test is isolating the root cause (timing, shared state, selector ambiguity) — not adding retries

---

### Q: Why do you have both a `smoke` project and a `chromium` project? What's the difference?

- `chromium` project has no `grep` filter — it runs all 86 tests (the regression suite)
- `smoke` project has `grep: /@smoke/` — it runs only the 8 tests tagged `@smoke` (the PR gate)
- This gives me two runnable configurations from one config file, one command each: `pnpm e2e` vs `pnpm e2e:smoke`
- The smoke suite is designed to complete in ~90 seconds — fast enough to run on every PR without slowing the team
- The regression suite runs nightly or before releases

---

### Q: In `shopping-flow.spec.ts`, why do some tests use the UI to add to cart while others use `addToCartApi`?

- The first test (`add product to cart updates header cart count`) is testing the ADD TO CART UI flow — it must use the ProductPage POM
- The other tests (cart page shows items, remove item, promo code) use adding-to-cart as a PRE-CONDITION, not as what they're testing
- Pre-conditions should be fast and reliable — `addToCartApi` takes ~200ms via direct API vs ~5s navigating to a product page
- Test isolation principle: only use the UI for what you're testing; use the API for everything else

---

### Q: In `data-validation.spec.ts`, why is there no `page` fixture? Isn't this a Playwright test?

- Playwright is not just a browser automation tool — it's a full test runner
- The `request` fixture and the direct Node.js `fetch` in these tests use Playwright's test runner (retries, reporters, globalSetup) without opening a browser
- SQL tests also use Playwright's runner but connect to PostgreSQL via `pg`
- This layered approach is intentional: UI tests, API tests, and SQL tests all produce results in the same HTML report

---

### Q: Why did you use `expect(res.status, message).toBe(200)` in the security tests loop instead of just `expect(res.status).toBe(200)`?

- The loop iterates over 4 admin endpoints
- Without the custom message, a failure would show: `Expected 200, received 403`
- With the custom message: `Expected 403 on GET /admin/inventory` — immediately tells you which endpoint failed
- In a loop, always annotate assertions with the context variable that identifies which iteration failed
- `expect(received, message).toBe(expected)` — the second argument is the failure message

---

### Q: In `CartPage.ts`, why does `removeFirstItem()` click the Remove button AND then click inside a `[role="dialog"]`?

- The cart's Remove button doesn't remove immediately — it opens a `ConfirmModal` dialog
- Without scoping to `[role="dialog"]`, there are TWO "Remove" buttons visible simultaneously: the original button and the confirm button in the modal
- `page.getByRole('button', { name: /remove/i })` in strict mode would fail: "resolved to 2 elements"
- Scoping to `modal.getByRole('button', { name: /remove/i })` finds exactly the confirmation button
- This is a real strict-mode violation I encountered and fixed during development

---

### Q: Why is the checkout test `@critical` but NOT `@smoke`?

- The MPesa stub auto-confirms after 5 seconds — the checkout test has a minimum runtime of ~8 seconds just for payment
- A well-designed smoke suite should complete in under 90 seconds total
- With 8 smoke tests already at ~90 seconds, adding a 30–40 second checkout test would double the smoke runtime
- `@critical` means it runs in the full regression suite and any explicit pre-release critical-only run
- The tradeoff: we accept not having checkout in the PR gate to keep the PR feedback loop under 2 minutes

---

### Q: Why does `globalSetup` run `pnpm db:seed` before every test run? Doesn't that slow down startup?

- Without the seed, `quantityOnHand` for products depletes across test runs
- Every confirmed order decrements `quantityOnHand` by 1
- After ~20 test runs, the HP EliteBook has 0 stock → all `beforeAll` blocks that add it to cart fail with `INSUFFICIENT_STOCK`
- The seed resets `quantityOnHand = 20, quantityReserved = 0` for all products on every run
- The seed takes ~5–8 seconds — acceptable for a global setup that runs once per suite
- Without this: tests fail mysteriously after many runs, hard to debug for someone who didn't build the suite

---

## API TESTING

### How do you validate a REST API response beyond just the status code?

```typescript
test('POST /auth/login — valid credentials', async ({ request }) => {
  const res = await request.post(`${API}/auth/login`, {
    data: { email: 'user@example.com', password: 'Test123!' },
  });

  // 1. Status code
  expect(res.status()).toBe(200);

  const body = await res.json();

  // 2. Required fields present
  expect(body).toHaveProperty('accessToken');
  expect(body).toHaveProperty('user');

  // 3. Correct types
  expect(typeof body.accessToken).toBe('string');
  expect(typeof body.user.id).toBe('string');

  // 4. Correct values
  expect(body.user.email).toBe('user@example.com');
  expect(body.user.role).toBe('CUSTOMER');

  // 5. Absence of sensitive data
  expect(body.user).not.toHaveProperty('passwordHash');

  // 6. Response time (if SLA matters)
  expect(Date.now() - startTime).toBeLessThan(500);
});
```

For paginated responses: validate `pagination.totalItems`, `pagination.page`, `data.length` relationship.
For booking responses: validate booking reference format, passenger count match, fare accuracy.

---

### How do you test authenticated API endpoints?

**Pattern used in this project:**
```typescript
// 1. Get token via API (not UI)
const auth = await loginViaApi(USERS.admin.email, USERS.admin.password);
const token = auth.token;

// 2. Use token in headers
const res = await fetch(`${API}/admin/inventory`, {
  headers: { Authorization: `Bearer ${token}` },
});
expect(res.status).toBe(200);

// 3. Test that the SAME endpoint returns 403 for a different role
const customerAuth = await loginViaApi(USERS.customer.email, USERS.customer.password);
const res2 = await fetch(`${API}/admin/inventory`, {
  headers: { Authorization: `Bearer ${customerAuth.token}` },
});
expect(res2.status).toBe(403);

// 4. Test that the endpoint returns 401 without any token
const res3 = await fetch(`${API}/admin/inventory`);
expect(res3.status).toBe(401);
```

**The three assertions are all required:** 200 for valid role, 403 for wrong role, 401 for no token. Each tests a different aspect of the authentication system.

---

### What's your approach to chaining API requests in a test?

```typescript
// Pattern: each request's output feeds the next
test('full booking validation', async () => {
  // Step 1: Search → get flight IDs
  const searchRes = await apiRequest('POST', '/flights/search', searchParams, token);
  const flightId = searchRes.flights[0].id;

  // Step 2: Book → use flight ID
  const bookingRes = await apiRequest('POST', '/bookings', {
    flightId,
    passengers: [passenger],
    paymentToken: 'TEST_TOKEN',
  }, token);
  const bookingRef = bookingRes.bookingReference;

  // Step 3: Validate booking exists
  const getRes = await apiRequest('GET', `/bookings/${bookingRef}`, undefined, token);
  expect(getRes.status).toBe('CONFIRMED');

  // Step 4: SQL validation — booking in DB matches API response
  const dbRecord = await queryDb('SELECT * FROM bookings WHERE reference = $1', [bookingRef]);
  expect(dbRecord[0].fare).toBe(bookingRes.totalFare);
});
```

**Key principles:**
- Each step extracts only what's needed for the next step — no God variables
- Type the response shapes: `apiRequest<FlightSearchResponse>('POST', ...)` — TypeScript catches schema changes
- Add an assertion after each step — don't just chain; verify each intermediate state

---

## SQL

### When would you use a LEFT JOIN vs INNER JOIN in a QA context?

**INNER JOIN** — use when both records MUST exist:
```sql
-- Verify every order has an associated order_items record
SELECT o.order_number, oi.product_name
FROM orders o
INNER JOIN order_items oi ON oi.order_id = o.id
-- If an order has no items, it won't appear — useful for verifying FK relationships
```

**LEFT JOIN** — use when you want to find MISSING records:
```sql
-- Find orders WITHOUT a corresponding OrderAddress (data integrity check)
SELECT o.order_number, oa.id as address_id
FROM orders o
LEFT JOIN order_addresses oa ON oa.order_id = o.id
WHERE oa.id IS NULL  -- ← Returns orders that are missing their address snapshot
```

**QA use case for LEFT JOIN:** auditing for orphaned or missing records — payment transaction exists but no order, order exists but no status history entry.

---

### Write a query to find all bookings in a 'pending' status from the last 7 days

```sql
-- Adapting to TrustCart schema (orders table)
SELECT
  order_number,
  email,
  total,
  payment_method,
  created_at
FROM orders
WHERE
  status = 'PENDING_PAYMENT'
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- For TripArc's booking system (hypothetical):
SELECT
  b.booking_reference,
  b.passenger_name,
  b.route,
  b.total_fare,
  b.created_at
FROM bookings b
WHERE
  b.status = 'PENDING'
  AND b.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY b.created_at DESC;
```

---

### How do you use SQL to validate data integrity after an end-to-end test?

**Pattern from my project:**
```sql
-- 1. Price snapshot: order_items.unit_price must equal product price at checkout time
SELECT
  o.order_number,
  oi.unit_price AS charged_price,
  p.price AS current_product_price,
  CASE WHEN oi.unit_price = p.price THEN 'MATCH' ELSE 'MISMATCH' END AS status
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.order_number = 'TC-2026-000047';

-- 2. Audit trail: every order must have at least one status history entry
SELECT o.order_number
FROM orders o
LEFT JOIN order_status_history osh ON osh.order_id = o.id
WHERE osh.id IS NULL;  -- Should return 0 rows

-- 3. Referential integrity: every order must have exactly one OrderAddress
SELECT o.order_number, COUNT(oa.id) as address_count
FROM orders o
LEFT JOIN order_addresses oa ON oa.order_id = o.id
GROUP BY o.order_number
HAVING COUNT(oa.id) != 1;  -- Should return 0 rows
```

---

### How do you find duplicate records in a table?

```sql
-- Find duplicate order_number values (should be unique)
SELECT order_number, COUNT(*) as count
FROM orders
GROUP BY order_number
HAVING COUNT(*) > 1;

-- Find duplicate booking references in a travel system
SELECT booking_reference, passenger_email, COUNT(*) as count
FROM bookings
GROUP BY booking_reference, passenger_email
HAVING COUNT(*) > 1;

-- Find the actual duplicate rows with full details
SELECT *
FROM orders
WHERE order_number IN (
  SELECT order_number
  FROM orders
  GROUP BY order_number
  HAVING COUNT(*) > 1
)
ORDER BY order_number, created_at;
```

**QA context:** run this as part of a post-deployment smoke check — duplicate booking references in a travel system would indicate a concurrency bug in the booking creation flow.

---

## GENERAL QA

### What's the difference between verification and validation?

**Verification** — "Are we building the product right?"
- Checking that deliverables conform to specifications
- Done during development: code reviews, test plans reviewed against requirements, API contracts checked against design docs
- Example: the login endpoint returns 200 with an `accessToken` field as specified in the API contract

**Validation** — "Are we building the right product?"
- Checking that the product meets user needs and business goals
- Done with end users or against real-world requirements
- Example: users can actually complete a booking in under 3 minutes on a mobile device

**In practice:**
- Automated tests are primarily verification — they check against known requirements
- Exploratory testing is primarily validation — discovering whether the product actually works for users
- Both are required; neither replaces the other

---

### How do you approach exploratory testing?

- Define a **charter** before starting: "Explore the flight search feature focusing on multi-city routing and date combinations" — not just "test the search"
- Set a **time box**: 60–90 minutes per session — prevents scope creep
- Keep **session notes**: what I tested, what I found, what I didn't test (for coverage awareness)
- **Follow intuition on interesting paths**: if something feels slightly wrong, dig deeper
- Document findings as you go — exploratory bugs are often hard to reproduce later
- After the session: convert any reproducible bugs into test cases
- **What exploratory testing is NOT**: clicking randomly without intent or documenting nothing

---

### What's your process for writing a bug report?

**Required fields:**
1. **Title**: `[Module] Brief description of the defect` → `[Checkout] Order created with KES 0 total when quantity is 0`
2. **Severity/Priority**: P1–P4 with justification
3. **Environment**: browser, OS, API version, test data used
4. **Steps to reproduce**: numbered, exact steps starting from a known state
5. **Expected result**: what should have happened (reference the requirement or acceptance criteria)
6. **Actual result**: what actually happened
7. **Evidence**: screenshot, video, network log, or SQL query result
8. **Reproducibility**: always/intermittent/once

**For API bugs:** include the curl command or request/response payload.
**For DB bugs:** include the SQL query that proves the incorrect state.

---

### What does ISTQB CTFL cover and how have you applied it?

**Core areas covered:**
- **Fundamentals of testing**: testing objectives, principles (e.g., "testing shows presence of defects, not their absence")
- **Testing throughout the SDLC**: shift-left, agile testing quadrants
- **Static testing**: reviews, inspections, walkthroughs
- **Test techniques**: equivalence partitioning, boundary value analysis, decision tables, state transition testing
- **Test management**: risk-based testing, estimation, metrics
- **Tool support**: test management tools, automation frameworks

**How I've applied it:**

- **Boundary value analysis**: in my security tests, I test quantity = 99999 (above limit) AND quantity = 1 (at limit) — both boundaries, not just one
- **State transition testing**: the order lifecycle (PENDING_PAYMENT → CONFIRMED → DISPATCHED → DELIVERED) is a state machine — my security tests verify invalid transitions are rejected
- **Equivalence partitioning**: for role-based access control, I group by role type rather than testing every individual user — ADMIN/MANAGER/STAFF/CUSTOMER as partitions
- **Risk-based prioritisation**: @smoke/@critical tags reflect risk assessment — high-risk (payment, auth, RBAC) run on every PR; lower-risk (browsing, search) run in nightly regression
- **Defect lifecycle awareness**: when to raise, when to escalate, when a fix needs regression — this informs how I prioritise automation backlog
