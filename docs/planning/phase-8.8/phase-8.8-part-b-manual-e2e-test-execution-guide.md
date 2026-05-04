Phase 8.8 Part B — Manual E2E Test Execution Guide
What's already done
Playwright installed (@playwright/test in root package.json)
Chromium browser downloaded
playwright.config.ts at project root
42 tests across 5 files in e2e/
Step 1: Start the environment (one terminal per service)
Terminal 1 — Docker services


pnpm docker:up
Expected: PostgreSQL and Redis containers start. Confirm in Docker Desktop: trustcart-postgres and trustcart-redis both show green.

Terminal 2 — API server


pnpm dev:api
Expected output (wait for this exact line):


[Nest] Application is running on: http://localhost:3001/api/v1
Terminal 3 — Web server


pnpm dev:web
Expected output (wait for this exact line):


▲ Next.js 14.x.x
✓ Ready in X.Xs
Note: First startup compiles all pages. This takes 30–90 seconds. Do not run tests until you see "Ready".

Step 2: Seed the database
In a fourth terminal from the project root:


pnpm db:seed
Expected:


🌱 Seeding database...
Creating users...
  ✓ Created 5 users
...
✅ Seeding complete!
Test credentials: any email with password "Test123!"
If you've seeded before and get constraint errors, that's fine — seed uses upsert so it's safe to re-run.

Step 3: Verify servers manually before running tests
Open a browser and confirm:

URL	Expected
http://localhost:3000	TrustCart home page loads with products
http://localhost:3001/api/v1/products	JSON response with product list
http://localhost:3001/api/docs	Swagger UI
If either URL fails, tests will also fail.

Step 4: Run the full test suite

npx playwright test
Expected terminal output (takes 3–5 minutes total):


🔍 Verifying servers are running...
  Waiting for API (port 3001)... ready
  ✓ API reachable
  Waiting for Web app (port 3000)... ready
  ✓ Web app reachable
  ✓ Seed data verified

Running 42 tests using 1 worker

  ✓ Customer Browsing › home page loads with product cards
  ✓ Customer Browsing › category page shows filtered products
  ...
  42 passed (3m 12s)
Step 5: Run individual test files if something fails
Run one file at a time to isolate failures:


# Browsing only (fastest, ~30s)
npx playwright test e2e/customer-browsing.spec.ts

# Auth only (~1 min)
npx playwright test e2e/auth.spec.ts

# Shopping flow — slowest due to MPesa stub (3 min)
npx playwright test e2e/shopping-flow.spec.ts

# Order management
npx playwright test e2e/order-management.spec.ts

# Admin
npx playwright test e2e/admin.spec.ts
Step 6: View the HTML report
After running, open the full visual report:


npx playwright show-report
This opens a browser tab showing each test with pass/fail, screenshots on failure, and timing.

What each test suite covers and expected behavior
customer-browsing.spec.ts (6 tests, ~30 s)
Test	What it checks	Pass condition
Home page loads	Products visible on homepage	Product card links present
Category page	/categories/laptops has products	Heading contains "laptop"
Product detail	Images, price, Add to Cart button	All three elements visible
Search results	/search?q=laptop returns products	At least one result card
Gibberish search	/search?q=xyznonexistent	"No results" message, no 500 error
Click product card	Navigates to detail page	URL changes to /products/...
auth.spec.ts (10 tests, ~1 min)
Test	What it checks	Pass condition
Register valid	New unique email	Redirected to /login?registered=true
Register duplicate email	john.doe@example.com	Error message about existing account
Login valid	john.doe@example.com / Test123!	Redirected to /account
Login wrong password	Bad credentials	Error message stays on /login
/account unauthenticated	No token in browser	Redirected to /login
View profile	Logged in as John Doe	"John" text visible on page
View addresses	Same user	Address/delivery text visible
Forgot password submit	Any email	"Check your email" success message
Reset password (no token)	/reset-password	"missing/invalid" error shown
Reset password (with token)	/reset-password?token=test	Form inputs visible
Logout + protect page	Clear localStorage → /account	Redirected to /login
shopping-flow.spec.ts (5 tests, ~3 min)
Test	What it checks	Pass condition
Add to cart	Click "Add to Cart" on HP EliteBook page	Success feedback visible
Cart page	Pre-add via API, view /cart	Product name and price shown
Remove from cart	Delete button in cart	Item disappears from list
Invalid promo code	Submit INVALIDCODE999	Error message shown
Full checkout flow	Add → Cart → Checkout → Place Order → Wait for MPesa stub (5 s) → Poll (every 3 s) → Redirect	Order number TC-YYYY-NNNNNN on confirmation page
The full checkout test has a 90 second timeout. It will appear to hang for ~10 seconds while polling — this is expected. You'll see the browser navigate to /checkout, then to /order-confirmation/... automatically.

order-management.spec.ts (5 tests, ~1 min)
These tests create an order via API in beforeAll — you'll see a brief API call before any browser opens.

Test	What it checks	Pass condition
Order history	/orders shows the created order	Order number visible
Order detail	Items, address, status timeline	Product name and "Pending Payment" visible
Unauthenticated orders	No token → /orders	Redirected to /login
Cancel button visible	PENDING_PAYMENT order	Cancel button present
Cancel order	Clicks cancel, confirms	"CANCELLED" status shown
admin.spec.ts (15 tests, ~2 min)
Test	What it checks	Pass condition
Customer blocked from /admin	Customer JWT → admin routes	Not on admin page / 403 shown
Staff can access dashboard	Staff JWT → /admin	No 403
Dashboard stats cards	4 stat cards visible	Revenue, Orders, Low Stock, Customers
Stats are real (not stub)	Old stub had 850 customers	850 and 1,250,000 NOT on page
Products list	/admin/products table	At least one row
Products search	Type "HP" → filter	First row contains "HP"
New product form	/admin/products/new	Form with name input visible
Inventory list	/admin/inventory table	"On Hand" and "Reorder" columns
Adjust stock modal	Click Adjust → fill form → submit	"adjusted successfully" toast
Inventory search	Type "HP" → filter	Rows filtered
Orders list	/admin/orders shows created order	Order number visible
Status filter	Select PENDING_PAYMENT	Filtered rows shown
Update order status	Update → CONFIRMED	"updated/success" toast
Refund button for Manager	Manager login → orders page	Refund button visible (if eligible order)
Refund button hidden for Staff	Staff login → orders page	No refund button
Common failure scenarios and how to fix them
Symptom	Cause	Fix
Global setup fails "Web app unreachable"	Next.js still compiling	Wait for "Ready in Xs" in Terminal 3, then re-run
Global setup fails "Seed data missing"	DB not seeded	Run pnpm db:seed
Full checkout test times out	MPesa stub didn't fire	Check API terminal for Stub MPesa payment completed log
"Order not found" in order-management	Seed produced no addresses	Check john.doe@example.com has a seeded Nairobi address
Admin tests show 403	Auth state not set correctly	Clear browser localStorage, re-run
Cannot find module	Playwright not installed	Run pnpm install then npx playwright install chromi