# TrustCart Kenya — QA Automation Suite

End-to-end, API-layer, SQL-validation, and security test suite built with Playwright + TypeScript.

---

## Architecture

```
e2e/
├── fixtures/
│   ├── users.ts                  # Seeded test credentials + known product slugs
│   ├── playwright.fixtures.ts    # Custom test.extend() fixtures (Phase 5)
│   └── test-data-factory.ts      # Unique user generator for test isolation (Phase 5)
│
├── helpers/
│   ├── api.ts                    # Typed Node.js fetch helpers (loginViaApi, clearCart, etc.)
│   ├── auth.ts                   # loginViaApi + setAuthInBrowser pattern
│   └── db.ts                     # Direct SQL queries for audit trail validation (Phase 3)
│
├── pages/                        # Page Object Model — lazy get properties, action methods
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── ProductPage.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   └── admin/
│       ├── AdminInventoryPage.ts
│       └── AdminOrdersPage.ts
│
├── global-setup.ts               # Server health check + DB seed before every run
├── global-teardown.ts            # Removes factory-generated test users after run
│
├── customer-browsing.spec.ts     # Home, category, product detail, search
├── auth.spec.ts                  # Register, login, forgot/reset password, logout
├── shopping-flow.spec.ts         # Cart, checkout, MPesa stub, order confirmation
├── order-management.spec.ts      # Order history, detail, cancellation
├── admin.spec.ts                 # Dashboard, products, inventory, orders, RBAC
├── api.spec.ts                   # API contract tests — status codes, response shapes
├── data-validation.spec.ts       # SQL-layer audit trail & integrity tests (Phase 3)
├── security.spec.ts              # IDOR, boundary enforcement, role isolation (Phase 4)
└── fixtures-demo.spec.ts         # Live demonstration of custom fixtures + factory (Phase 5)
```

---

## Running Tests

```bash
# Prerequisite: both servers must be running
pnpm docker:up       # PostgreSQL + Redis
pnpm dev             # NestJS API (port 3001) + Next.js web (port 3000)

# Full regression suite (80 tests)
pnpm e2e

# Smoke suite only — 8 critical-path tests, ~90 s (used in CI on every PR)
pnpm e2e:smoke

# Single spec file
npx playwright test e2e/security.spec.ts

# Filter by tag
npx playwright test --grep @critical

# Interactive UI mode — live browser, step through tests
pnpm e2e:ui

# View last HTML report
pnpm e2e:report
```

---

## Test Tiers

| Tag | Purpose | Count | Typical runtime |
|-----|---------|-------|----------------|
| `@smoke` | Business-critical path validation — runs on every PR in CI | 8 | ~90 s |
| `@critical` | Tests whose failure indicates a production incident | 12 | (subset of regression) |
| `@regression` | Full coverage — runs nightly or before release | 80 | ~5–6 min |

---

## Key Design Decisions

### 1. `workers: 1` — serial execution
Tests share `john.doe@example.com`'s cart. Parallel workers corrupt cart state between tests. The fix is progressive: the **test data factory** (Phase 5) creates isolated users per test, enabling `workers: 2+` for those tests. Migration is ongoing.

### 2. `loginViaApi` + `setAuthInBrowser` — not the login form
UI login adds ~3–4 s per test. `loginViaApi` uses Node.js `fetch` directly (~200 ms) and `setAuthInBrowser` injects the token into localStorage via `page.evaluate`. Auth correctness is tested separately in `auth.spec.ts`.

### 3. Lazy `get` properties on Page Objects
```typescript
// ❌ Constructor assignment — stale element reference after navigation
constructor(page: Page) {
  this.placeOrderButton = page.getByRole('button', { name: /place order/i }); // captured once
}

// ✅ Lazy getter — re-evaluates against current DOM on every access
get placeOrderButton() {
  return this.page.getByRole('button', { name: /place order/i }); // always fresh
}
```

### 4. Scoped locators over `.first()` for strict-mode compliance
```typescript
// ❌ Hides ambiguity — silently picks the wrong element
page.getByText(/Pending Payment/i).first()

// ✅ Scope to the specific section — failure message is meaningful
page.locator('h2', { hasText: /order timeline/i })
    .locator('..')
    .getByText(/Pending Payment/i)
```

### 5. SQL validation layer for audit trails
The UI can verify a status badge changes. Only a direct SQL query can confirm:
- `order_items.unit_price` was captured at checkout time (price snapshot)
- `order_status_history` has the correct `changed_by_type` and `reason`
- `stock_adjustments` created a record with the right `reference_id`

This directly addresses the role requirement: *"Writing and executing SQL queries to support data validation and backend testing."*

### 6. Custom fixtures (Phase 5)
```typescript
// Before — 3 lines of boilerplate per test
test('...', async ({ page }) => {
  const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
  await setAuthInBrowser(page, auth);
  // ...
});

// After — intent is in the signature
test('...', async ({ customerPage }) => {
  // page is already authenticated
});
```

### 7. Global setup seeds on every run
```typescript
execSync('pnpm db:seed', { cwd: process.cwd(), stdio: 'pipe' });
```
Each test run resets `quantityOnHand = 20, quantityReserved = 0` for all products. Without this, confirmed orders from previous runs deplete inventory and cause `INSUFFICIENT_STOCK` failures after ~20 runs.

### 8. `retries: 0` — honest CI results
Retries hide flaky tests. Every failure is a genuine problem. Flaky test rate is tracked as a KPI — any test that fails > 2 % of runs is a P1 fix.

---

## CI Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs:

```
lint → type-check
         ↓
   test-api   test-web   (parallel)
         ↓
        build
         ↓
    test-e2e  (smoke suite only — ~90 s)
         ↓
    upload playwright-report artifact (always)
    upload test-results artifact (on failure only)
```

The smoke suite runs on every PR. The full regression suite runs locally before release or on a nightly schedule.

---

## Known Constraints

| Item | Status | Notes |
|------|--------|-------|
| `workers: 1` | Intentional | Shared DB state; factory users will enable parallelism |
| `AdminInventoryService` 500 on dev server | Known defect | Resolves after server restart; UI tests prove endpoint works |
| MPesa stub delay (5 s) | By design | Checkout test has 90 s timeout; `@smoke` excludes it for PR speed |
| No cross-browser | Planned Phase 7 | WebKit + Firefox projects commented in config |
| No accessibility tests | Planned Phase 7 | `@axe-core/playwright` integration ready to add |
