# Role-Specific & Scenario Questions — Answers (Point Form)
## TripArc QA Automation Engineer Interview

---

## AUTOMATION STRATEGY

### How do you decide what to automate vs keep manual?

**Automate when:**
- Test is repeated every sprint (regression candidate)
- Test has a clear, stable pass/fail condition
- Test involves data that's hard to verify manually (DB state, API response shapes)
- Test covers a security control (RBAC, IDOR) — human error is too risky
- Test is part of the critical path (checkout, payment, booking confirmation)

**Keep manual when:**
- Feature is new and changing rapidly — automation of unstable UI costs more than it saves
- Test requires subjective judgement (visual design, UX flow, emotional response)
- Exploratory testing of new features — humans find unexpected failure modes
- One-off data migrations or environment-specific scenarios

**My applied rule:**
- If I've manually run this test more than 3 times, it's a candidate for automation
- If automating it will take longer than running it manually for 6 sprints, defer it
- Risk-based prioritisation: automate the tests where a defect would cause the most damage first

---

### How would you approach building automation from scratch for a complex travel booking product?

- **Start with stakeholder conversations, not a tool choice**: which flows cause the most manual regression pain? Which defects reached production last quarter?
- **Map the user journeys first**: search → select → book → pay → confirm → manage booking — each step is a test suite candidate
- **Layer 1 — API tests first**: faster to write, environment-independent, directly test business rules. Validate: booking creation, fare calculation, seat availability, payment status
- **Layer 2 — Critical path E2E**: the full booking flow from search to confirmation. One test, multiple `test.step()` blocks, runs in ~2 minutes
- **Layer 3 — Regression suite**: expand from critical path to edge cases, error states, cancellation flows, amendment flows
- **Layer 4 — Data validation**: SQL queries on the booking record — price, itinerary details, passenger data, status history
- **Layer 5 — Security**: IDOR checks between bookings, role enforcement for agent-only vs admin-only operations
- **CI integration early**: even 5 tests in a CI gate on day 1 establishes the behaviour before the backlog grows
- **Document every decision**: which tests are @smoke, which are @regression, why certain flows stayed manual

---

### How do you prioritise which test cases to automate first?

Priority order (most important first):
1. **Booking critical path** — search → select → pay → confirm. If this breaks, revenue stops.
2. **Payment flows** — successful payment, failed payment, timeout, refund initiation
3. **Role-based access control** — agents can only see their own bookings; admins can see all; customers cannot access agent tools
4. **Price integrity** — fare shown = fare charged = fare stored in DB. This is a compliance and financial risk.
5. **Cancellation and amendment flows** — high customer service volume when these break
6. **Authentication** — login, session expiry, password reset
7. **API contract tests** — endpoint status codes, required response fields, pagination

Defer to manual:
- New features in development (unstable)
- Visual regression (requires specialised tooling)
- Load and performance (different toolset — k6 or Gatling)
- Exploratory testing of edge cases

---

### How do you handle flaky tests?

**Never use retries to suppress flakiness**
- A retried pass is a hidden fail. It erodes trust in the suite.

**Diagnosis first:**
- Is it a timing issue? → Replace `waitForTimeout` with a condition-based wait (`waitForSelector`, `waitForResponse`, `toBeVisible`)
- Is it shared state? → Add `clearCart()` or equivalent in `beforeEach`; use isolated test users via the data factory
- Is it a selector that matches multiple elements? → Use scoped locators, `getByRole`, or scope to a container element
- Is it a test ordering dependency? → Tests must be fully independent; any dependency is a design flaw

**Track and report:**
- Measure flaky test rate per sprint (failures / total runs)
- Any test flaking more than 2% of runs is a P1 fix — not a CI config tweak

**In my project:**
- `workers: 1` with `retries: 0` — means every failure is honest
- `clearCart()` in every `beforeEach` in shopping-flow — eliminates shared cart state
- `pnpm db:seed` in `globalSetup` — resets inventory to known values before every run

---

### How would you structure a Playwright test suite for a multi-step booking flow (search → select → checkout → confirm)?

```
booking-flow.spec.ts

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // API-based login + clear any previous booking state
    await loginViaApi(...);
    await setAuthInBrowser(page, auth);
  });

  test('search returns relevant results', ...) // @smoke @regression
  test('selecting a flight shows correct fare', ...) // @regression
  test('fare is locked at selection — not updated at checkout', ...) // @critical @regression
  test('full booking flow: search → select → pay → confirm', { tag: ['@critical'] }, async ({ page }) => {
    test.setTimeout(120_000); // booking + payment confirmation

    await test.step('search for flights', async () => { ... });
    await test.step('select flight and fare', async () => { ... });
    await test.step('enter passenger details', async () => { ... });
    await test.step('complete payment', async () => { ... });
    await test.step('verify confirmation page and booking reference', async () => { ... });
  });
  test('cancellation reflects in booking history', ...) // @regression
});
```

**Key decisions for TripArc context:**
- Seed search parameters via test fixtures, not UI typing — consistent test data
- The fare-lock test (step 3) is the most important: price at selection must equal price at payment
- `test.step()` on the full flow — if payment fails, the report says "complete payment failed", not a line number
- API-seed the passenger record if testing amendment flows to avoid re-entering details each time

---

## TRAVEL BOOKING DOMAIN

### A flight search returns results but a specific route is always missing — how do you investigate?

**Step 1 — Reproduce and isolate:**
- Is it this specific origin-destination pair? Try variations (different dates, one-way vs return)
- Is it in the UI only, or also via the search API?

**Step 2 — API layer investigation:**
- Call the search endpoint directly: `POST /api/flights/search` with that origin-destination
- Compare the raw API response to what the UI renders — if the API returns it but the UI doesn't, it's a frontend filter/display bug

**Step 3 — Data and inventory check:**
- SQL: does this route exist in the route/availability table? Is it marked as active?
- Are there capacity or date restrictions that might exclude it?
- Is the GDS or supplier providing availability for this route?

**Step 4 — Integration check:**
- Check the GDS connection log for that route — is the request leaving the system? Is the response returning?
- Is there a fare basis code filtering issue? (Route exists but no available fare classes)

**Step 5 — Document and escalate:**
- Write: "Route X→Y missing. API returns 0 results for this route. DB shows route exists and is active. GDS request logs show [status]. Suspected GDS availability or fare mapping issue."
- That's actionable for the data/integration team, not a vague "it doesn't work"

---

### How would you test a date picker in a booking form?

**Functional boundaries:**
- Select today's date — must be available (or blocked if same-day restrictions exist)
- Select yesterday — must be blocked (past date)
- Select a date at the max booking window (e.g., 12 months ahead) — must be available
- Select a date beyond the max window — must be blocked
- Select return date before departure date — must be blocked or show an error

**Integration:**
- Selected date appears correctly in the booking summary
- Date is sent in the correct format to the backend API (ISO 8601 vs local format — a common bug)
- Date displays correctly in the confirmation email

**API-level:**
- POST booking with a past date — must return 400 with a meaningful error, not a 500
- POST booking with departure date = arrival date for a flight — must be validated

**Automation approach:**
- Use `page.evaluate(() => new Date().toISOString().split('T')[0])` to get today's date dynamically — no hardcoded dates that expire
- Parameterise: test with dates in different locales if the UI renders locale-specific formats

---

### How do you test that pricing is consistent between the search results page and the checkout page?

This is the **fare-lock test** — one of the most critical tests in any booking system.

**Test approach (two-point verification):**
```
1. Capture fare from search results → store in a variable
2. Select that fare → navigate to checkout
3. Assert: displayed fare at checkout === fare captured in step 1
4. Assert: fare in the API response for booking creation === same value
5. Assert (SQL): booked_fare in the bookings table === same value
```

**Edge cases to test:**
- Price change between search and checkout (simulate by changing price in DB between the two steps)
- Currency conversion if applicable — displayed vs charged currency
- Tax and fee breakdown: total = base fare + taxes + fees (no hidden additions)
- Multi-passenger: fare × passenger count = total

**For TripArc specifically:**
- Their ADX platform has a "zero debit memo guarantee" for air — that means the fare charged to the agency must match what was contracted. This is exactly a fare-lock test.

---

### How would you validate that a booking confirmation email contains the correct itinerary details?

**API-level (preferred):**
- If the email service exposes a notification/template API, validate the payload directly
- Check: booking reference, passenger names, origin, destination, departure/arrival times, fare, cancellation policy

**Database validation:**
- Query the notification_log or email_queue table after booking
- Confirm the email record was created with the correct booking_id and template_type

**Mailhog/mailpit for local environments:**
- Use `GET /api/v2/messages` to retrieve captured emails
- Parse the body for booking reference, passenger name, itinerary details
- Assert all key fields match the booking record in the DB

**Production-like environments:**
- Mailtrap or similar email sandbox
- Use their API to programmatically read and assert email content

**What I wouldn't do:**
- Assert on the visual design of the email — that's manual testing
- Use a real email address and wait for delivery — too slow, too unreliable for automation

---

## COLLABORATION & PROCESS

### How do you communicate blockers in a standup without slowing the team down?

**Formula: one sentence, one ask**
> "I'm blocked on [specific thing] — I need [specific help or information] from [specific person]. I'll pick it up after standup."

**What I don't do:**
- Explain the full technical context in the standup (do that async or in a follow-up conversation)
- Present the problem without a proposed solution or ask
- Wait until standup to raise a blocker that's been sitting since yesterday (use Slack async for critical blockers)

**Pre-standup habit:**
- Post async blocker note 15 minutes before standup: "🔴 Blocked: API endpoint returns 500 for admin inventory queries. Investigating since yesterday — may need backend team input."
- Standup then becomes: "Mentioned in Slack — John, can we connect after this?"

---

### A developer says your automated test is wrong, not the code. How do you handle it?

- Stay curious, not defensive: "Let's look at it together"
- Walk through the test step by step: what is the test doing, what is it asserting, what is it receiving
- Check the test specification: does the test reflect the acceptance criteria or a stated requirement?
- If there's ambiguity: escalate to the product manager for a ruling on expected behaviour — not a debate between two engineers
- If the developer is right: acknowledge it immediately, fix the test, add a comment explaining the correct behaviour
- If the developer is wrong: present the spec or acceptance criteria, not just the test — the test is evidence, not the arbiter
- Either way: add a comment to the test explaining the expected behaviour so the next person doesn't have the same debate

---

### How do you stay current with QA trends and apply them to your team?

- Follow Playwright release notes (they move fast — 1.42 introduced test tags, 1.56+ improved trace UI)
- Ministry of Testing community — practical articles over theory
- ISTQB continuing education — even post-certification, new modules (mobile, AI testing, agile extension)
- Apply things incrementally: don't propose a full platform rewrite, propose one improvement per quarter
- Share learnings in retros or team wikis: "I tried X, here's what it solved and what it didn't"
- For TripArc specifically: I'd want to understand the current state of manual test documentation before proposing tooling

---

### How would you drive a shift from manual to automated testing on a resistant team?

- **Don't start with a manifesto** — start with one pain point: "What's the most repetitive thing you test every sprint?"
- **Show, don't tell**: automate that one thing, run it in front of the team, show the 3-minute run vs 45-minute manual
- **Make it low-risk**: offer to automate 3 tests per sprint without anyone else changing their workflow — let the value accumulate
- **Involve the team**: ask manual testers to review the tests — they know the domain, their input makes the tests better and gives them ownership
- **Document what automation won't replace**: exploratory testing, UX judgement, new feature discovery — manage expectations
- **Track the metric**: time saved per sprint, regression cycles shortened — give the team data to feel proud of
- **Escalate wins, not just problems**: when automation catches a regression, celebrate it publicly in the standup

---

## CI/CD & ENVIRONMENT

### How do you handle tests that pass locally but fail in CI?

**Most common root causes:**
- **Timing**: local machine is faster; CI is slower → replace `waitForTimeout` with condition-based waits
- **Environment variables**: token, baseURL, or DB connection missing in CI → check the pipeline's env block
- **Database state**: local has data from previous sessions; CI starts clean → my solution: `globalSetup` seeds the DB before every CI run
- **Port conflicts**: CI agent has another service on port 3000 → use explicit port config and health checks before tests start
- **Headless rendering differences**: animations, lazy-loaded content behaves differently → add explicit `waitForLoadState` or visibility checks
- **OS differences**: path separators, locale, timezone — if running cross-OS in CI

**My diagnostic process:**
1. Run the failing test locally in headless mode first — eliminates most rendering differences
2. Check CI logs for the exact failure line — often the error message tells you exactly what's missing
3. Add `--debug` or `trace: 'on'` for one run to get a full trace file
4. Check if the test fails consistently or intermittently — consistent = environment config; intermittent = timing or state

---

### How would you manage test data across environments?

- **Never hardcode environment-specific data** in tests — use environment variables or per-environment fixture files
- **Seed data as code**: the `pnpm db:seed` script is version-controlled — runs identically in local, dev, staging, CI
- **Isolated test users**: the data factory creates unique users per test run (email like `@trustcart-e2e.test`) — cleaned up after each run
- **Protect production data**: automated tests must never run against production with write operations — use feature flags or environment guards
- **For TripArc context**: booking test data needs to be realistic but never real — PNR codes, passenger names, card numbers must all be test values that can't be confused with live bookings

---

### How would you integrate Playwright into a CI pipeline?

**My actual GitHub Actions structure (from this project):**

```yaml
jobs:
  lint → type-check             # Fail fast — catch code issues first
  test-api + test-web           # Unit tests, parallel
  build                         # Build artifacts
  test-e2e:                     # E2E smoke suite
    needs: build
    services: postgres, redis   # Spin up test infrastructure
    steps:
      - Install Playwright Chromium
      - Seed database
      - Start API + web dev servers
      - wait-on: wait for both servers to be healthy
      - Run: pnpm e2e:smoke      # 8 tests, ~90 seconds
      - Upload HTML report artifact (if: always)
      - Upload test-results (if: failure)
```

**Key principles:**
- Run smoke suite on every PR — fast feedback, blocks merge if critical path is broken
- Run full regression suite on a nightly schedule or before release branches
- Always upload the HTML report — team members need to inspect failures without local setup
- Use `wait-on` to gate test execution on server health — prevents false failures from slow startup
