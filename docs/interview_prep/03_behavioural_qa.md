# Behavioural Questions — STAR Answers (Point Form)
## TripArc QA Automation Engineer Interview

---

### Tell me about a time you caught a critical bug before it reached production

**S:**
- Working on a fintech platform processing mobile money transactions
- A sprint was wrapping up and the team was ready to deploy a new fee calculation feature to staging

**T:**
- My job was to regression-test the checkout flow, not specifically look for fee bugs

**A:**
- While running my automated regression suite, a payment total assertion failed — the amount charged didn't match the amount displayed
- Investigated: the backend fee calculation changed for international transactions but the UI display was still using the old formula
- The discrepancy was only ~2% — easy to miss in manual testing but the exact assertion in my automated test caught it
- Raised it as a P1: financial calculation error affecting customer-facing amounts
- Wrote a detailed bug report with the SQL query that proved the stored amount differed from what was shown

**R:**
- Bug fixed before deployment — would have caused incorrect charges for international transactions
- Added a specific test case to the regression suite: UI-displayed amount vs API-returned amount vs DB-stored amount — three-point verification
- This became a standard pattern for financial totals in the suite

---

### Tell me about a time you had to learn a new tool or framework quickly

**S:**
- Previous projects used Selenium with Java; a new client required Playwright with TypeScript
- I had 2 weeks before the first automation sprint

**T:**
- Needed to be productive enough to contribute test coverage to an active sprint, not just learn in isolation

**A:**
- Spent the first 3 days on fundamentals: Playwright docs, official examples, and understanding the key differences (auto-waiting, locator strategies, request fixture)
- Built a small prototype framework alongside the learning — POM, config file, one spec file covering login
- Day 4: identified that my Selenium habit of using XPath selectors was incompatible with Playwright best practices — switched to role-based and semantic locators
- Days 5–14: contributed to the actual sprint by writing tests for the critical path, using the prototype as the template
- Asked specific questions when stuck (not "how does Playwright work?" but "why does this locator work in UI mode but not headless?")

**R:**
- Delivered 12 working tests by end of week 2, covering the checkout critical path
- The framework I established became the team's template for the next 6 months
- I now have 86 tests in Playwright across a full-stack project — the quick ramp became deep expertise

---

### Tell me about a time you disagreed with a developer about a bug's severity

**S:**
- Found a bug where a customer could add a quantity of 0 to the cart — the cart would show an item with price KES 0
- Developer classified it as P3 (low priority) — "nobody would actually do that"

**T:**
- I believed it was at minimum P2 because it corrupted cart state and potentially the order total

**A:**
- Didn't argue in the standup — asked for 10 minutes to demonstrate the impact
- Showed: adding quantity 0 → proceeding to checkout → order created with KES 0 total → payment record created
- The order existed in the DB as a confirmed zero-amount transaction — that's an accounting and audit problem, not just a UI glitch
- I brought the SQL evidence: `SELECT * FROM orders WHERE total = 0` — several test orders existed
- Escalated to the product manager with a clear risk statement: "This creates zero-amount orders in our financial records"

**R:**
- Bug was reclassified to P1 by EOD and fixed in the same sprint
- Added boundary validation test for quantity: 0, negative numbers, and non-integers
- The developer actually thanked me afterwards — the DB evidence made the impact undeniable

---

### Tell me about a time a test suite you built prevented a regression

**S:**
- Had built a Playwright suite for an e-commerce platform's checkout flow including a specific test: "unit_price in order_items equals product price at checkout time"
- 3 weeks after launch, a developer updated the pricing service to show discounted prices on the product listing page

**T:**
- The developer didn't update the checkout service — the discounted price appeared in the UI but the order was being created at the original price

**A:**
- My data-validation test caught this immediately on the next CI run
- `getProductPrice(slug)` returned the discounted price, but `getOrderItems(orderNumber)` returned the original price — assertion failed
- The error was: "Expected 39990 to be 45990" — immediately told us which price was wrong
- This would have been invisible to a UI tester: the page looked correct (discounted price shown), the receipt looked correct (discounted price shown), but the backend was charging full price

**R:**
- Regression caught in CI before it reached staging
- Developer fixed the pricing service integration within 2 hours
- The incident became the internal argument for "why we test the database, not just the UI"
- This exact test is now in the suite I showed you today in `data-validation.spec.ts`

---

### Tell me about a time you had to balance manual and automated testing under time pressure

**S:**
- Sprint deadline in 3 days; 2 new features shipped simultaneously — a complex discount engine and a new payment method
- I had automated tests for existing flows but nothing for these new features

**T:**
- Had to decide: try to automate both, automate one and manually test the other, or manual only with a plan to automate later

**A:**
- Did a quick risk analysis: discount engine had many edge cases (stacking, expiry, per-user limits) — wrong there = financial loss; payment method had fewer edge cases but was visible to customers
- Decision: manual exploratory testing on both for this sprint to get coverage now; automate the discount engine first in the next sprint because the edge-case matrix was too risky to leave to manual-only
- Created a detailed manual test session charter for the payment method, documented all tested scenarios and evidence
- Wrote automation skeletons (empty test blocks with comments) for both — reserved the test structure for next sprint

**R:**
- Found 2 bugs in the discount engine through exploratory testing that would have passed a happy-path script
- Delivered working manual coverage in time; automated in sprint N+1 as planned
- Sprint goal met, no tech debt surprise — the automation backlog was visible and scheduled

---

### Tell me about a time you improved a QA process or introduced automation where there was none

**S:**
- Joined a team where all regression testing was done manually in a shared spreadsheet
- Regression cycle took 2 days before every release; releases were monthly to avoid regression pain

**T:**
- Goal: reduce regression time to under 2 hours and enable more frequent releases

**A:**
- Started with a conversation, not a tool: asked the team what the most painful regression was — they said the payment flow, because it involved multiple steps and was tested 100% manually every time
- Wrote a Playwright smoke suite for the payment critical path first (5 tests) — showed it running in 3 minutes vs 45 minutes manual
- Demonstrated in the next sprint review — team immediately saw the value
- Gradually expanded: each sprint I automated 3–5 of the most-repeated manual test cases
- Documented every automation decision: why this test was automated, what it proves, what it doesn't cover
- Taught one junior QA engineer to write tests using templates I had created — scaled beyond just my output

**R:**
- After 3 months: regression coverage went from 0% automated to 60% of the critical paths
- Release cadence moved from monthly to bi-weekly
- The manual regression cycle went from 2 days to 4 hours (manual only running exploratory and new-feature testing)
- This mirrors the shift TripArc is trying to make — I've done this before

---

### Tell me about a time you had to communicate a complex technical issue to a non-technical stakeholder

**S:**
- Found a race condition in a payment callback endpoint: two simultaneous webhook calls from the payment provider could create duplicate transactions
- The CTO asked me to explain the risk to the CEO for a board-level decision on delaying the release

**T:**
- Needed to explain a concurrent processing bug without using the words "race condition", "webhook", or "async"

**A:**
- Used an analogy: "Imagine two cashiers at a till both scanning the same item at the same time — both think they've rung it up, and the customer is charged twice"
- Showed a simple demo: two browser tabs, initiated the same payment 1 second apart, showed two transaction records in a table on screen
- Quantified the risk: "Based on our transaction volume, this could affect approximately 12 customers per hour during peak traffic — each would be double-charged"
- Gave three options with timelines and recommended the middle option (add idempotency key validation, 2-day fix)
- Did not use any technical jargon — kept every sentence answerable with yes/no questions from the CEO

**R:**
- CEO approved the 2-day fix delay without escalation to the board
- The idempotency key fix was implemented and tested
- The CEO told the CTO it was the clearest technical explanation she'd received — referenced it as a communication standard for the team

---

### Tell me about a time you worked across time zones or on a remote team

**S:**
- Worked with a distributed team: engineering in Poland (UTC+1), QA in Kenya (UTC+3), product in the UK (UTC)
- Daily standup was at 8 AM UK time = 9 AM EAT — manageable, but most engineering happened outside my overlap

**T:**
- Needed to maintain quality without real-time access to developers when bugs surfaced during my working hours

**A:**
- Developed a clear bug reporting standard that meant developers could understand and reproduce issues without a meeting
- Used Loom for short screen-recordings of test failures: "here's the test, here's what it expects, here's what happened, here's the DB query that shows why"
- Flagged P1 bugs via Slack with a "🔴 P1 — blocks release" prefix — team knew to respond within 2 hours regardless of timezone
- Used async pre-standup notes in a shared doc: "tested X, found Y, blocked on Z" — standup became decisions, not status updates
- Built CI notifications: Slack bot posted pass/fail summaries from every pipeline run, visible to the whole team instantly

**R:**
- Reduced the average bug resolution time despite the timezone gap — asynchronous communication was actually more efficient for some categories
- The async standup format was adopted by the whole team, not just the QA workflow
- Direct preparation for the TripArc role structure (3 PM–12 AM EAT overlapping with Toronto business hours)

---

### Tell me about a time you failed at something and what you learned

**S:**
- Built a comprehensive Selenium suite for a web application
- The application did a major UI redesign sprint — 70% of my locators broke overnight

**T:**
- Sprint delivery was delayed 3 days while I fixed the suite instead of writing new tests

**A:**
- I had used XPath locators based on CSS class names and DOM position: `//div[@class='btn-primary'][2]`
- These were fragile by design — any styling or layout change would break them
- After the fix sprint, I did a full audit: replaced all positional/class-based locators with semantic ones (`getByRole`, `getByLabel`, `getByTestId`)
- Added a locator review step to the PR checklist: "Does this locator survive a CSS-only change?"
- Wrote an internal post-mortem — shared it with the team as a learning document, not a blame document

**R:**
- Post-redesign, the suite was locator-stable — the same redesign a year later caused zero locator failures
- This is directly why in my current Playwright project every locator in the page objects uses `getByRole`, `getByLabel`, or semantic text — I learned that lesson the hard way
- The post-mortem practice became standard for significant test failures in our team
