# Business Model & Revenue Flows

**Document Status:** Draft — Pending Human Sign-off  
**Last Updated:** 2026-01-18  
**Version:** 1.0  
**Currency:** Kenyan Shilling (KES)

---

## 1. Revenue Streams

The platform generates revenue through the following channels:

| Revenue Stream                 | Description                                                                      | Priority            |
| ------------------------------ | -------------------------------------------------------------------------------- | ------------------- |
| **Product Sales**              | Sale of electronics inventory at marked-up prices over cost of goods sold (COGS) | Primary             |
| **Delivery Fees**              | Fees charged to customers for order delivery (when applicable)                   | Secondary           |
| **Extended Warranty (Future)** | Optional paid warranty extensions beyond standard coverage                       | Deferred to Phase 2 |

### Revenue Stream Details

#### 1.1 Product Sales

- All products are sold at prices set by the business based on:
  - Cost of goods sold (purchase price from supplier)
  - Target gross margin (minimum 15%, target 20-30% depending on category)
  - Competitive market pricing
- Pricing references industry benchmarks from established Kenyan electronics retailers

#### 1.2 Delivery Fees

- Delivery fees are charged based on location and order value
- See Section 4 for detailed delivery fee structure
- Delivery fees are revenue, not a pass-through cost

#### 1.3 Excluded Revenue Streams (v1)

The following are **explicitly not** revenue sources in MVP:

- Marketplace commissions (no third-party sellers)
- Advertising or listing fees
- Installation or setup fees
- Trading-in or buy-back programs
- Financing interest (no BNPL in v1)

---

## 2. Product Pricing Rules

### 2.1 Base Pricing Logic

| Rule                  | Description                                                                         |
| --------------------- | ----------------------------------------------------------------------------------- |
| **Pricing Authority** | All product prices are set by authorized staff (admin role)                         |
| **Price Basis**       | Prices are based on COGS plus target margin, benchmarked against market rates       |
| **Price Display**     | All prices displayed to customers are **VAT-inclusive**                             |
| **Price Precision**   | Prices are displayed in whole shillings (no cents/decimal places)                   |
| **Price Lock**        | Price at time of order placement is the price charged (no post-order price changes) |

### 2.2 VAT Handling

| Item                 | Value                                                  |
| -------------------- | ------------------------------------------------------ |
| **VAT Rate**         | 16% (Kenya standard rate)                              |
| **VAT Inclusion**    | All customer-facing prices include VAT                 |
| **VAT Calculation**  | VAT = Price × (16 ÷ 116)                               |
| **VAT Registration** | Business must be VAT-registered with KRA before launch |

> [!IMPORTANT]
> **VAT Assumption:** The business is assumed to be VAT-registered. If turnover is below the KES 5M threshold, VAT collection may not be required initially. Confirm with accountant before launch.

### 2.3 Price Rounding Rules

| Context            | Rule                                                         |
| ------------------ | ------------------------------------------------------------ |
| **Display Prices** | Rounded to nearest KES 10 (e.g., KES 45,990, not KES 45,987) |
| **Cart Totals**    | Exact sum of item prices (no rounding)                       |
| **Delivery Fees**  | Fixed amounts, no rounding needed                            |
| **Refunds**        | Exact amount paid, no rounding                               |

### 2.4 Currency Rules

| Rule                 | Value                                                       |
| -------------------- | ----------------------------------------------------------- |
| **Currency**         | Kenyan Shilling (KES) only                                  |
| **Currency Symbol**  | "KES" or "Ksh" — consistently formatted throughout platform |
| **Foreign Currency** | Not accepted. No currency conversion.                       |
| **Price Format**     | Use thousand separators: KES 45,990 (not KES 45990)         |

### 2.5 Typical Price Ranges by Category

Based on market research (reference: Zurimall, 2026):

| Category                           | Typical Price Range (KES) |
| ---------------------------------- | ------------------------- |
| Budget Laptops (Ex-UK/Refurbished) | 25,000 – 50,000           |
| Mid-range Laptops (Brand New)      | 50,000 – 100,000          |
| Premium Laptops (MacBooks, Gaming) | 100,000 – 250,000         |
| Smartphones (Ex-USA)               | 15,000 – 80,000           |
| Smartphones (Brand New)            | 20,000 – 150,000          |
| TVs (32" – 55")                    | 15,000 – 80,000           |
| Monitors                           | 8,000 – 40,000            |
| Accessories                        | 500 – 10,000              |

---

## 3. Discounts & Promotions

### 3.1 Allowed Discount Types

| Discount Type             | Description                      | Example                              |
| ------------------------- | -------------------------------- | ------------------------------------ |
| **Percentage Discount**   | % off original price             | 10% off all laptops                  |
| **Fixed Amount Discount** | Flat KES reduction               | KES 2,000 off orders over KES 50,000 |
| **Promo Code**            | Customer enters code at checkout | Code: LAUNCH500 for KES 500 off      |

### 3.2 Discount Eligibility Rules

| Rule                        | Description                                |
| --------------------------- | ------------------------------------------ |
| **Product-level discounts** | Applied to specific products or categories |
| **Cart-level discounts**    | Applied to entire cart (e.g., promo codes) |
| **Minimum order value**     | Some discounts require minimum cart total  |
| **First-order discounts**   | May be restricted to first-time customers  |

### 3.3 Stacking Rules

> [!WARNING]
> **Default Rule:** Discounts do **NOT** stack unless explicitly configured otherwise.

| Scenario                            | Allowed?                                                |
| ----------------------------------- | ------------------------------------------------------- |
| Product discount + promo code       | ❌ No (promo code replaces product discount if greater) |
| Product discount + free delivery    | ✅ Yes (these are independent)                          |
| Multiple promo codes on same order  | ❌ No (only one promo code per order)                   |
| Staff discount + any other discount | ❌ No                                                   |

### 3.4 Time-Based Promotions

| Rule                         | Description                                                               |
| ---------------------------- | ------------------------------------------------------------------------- |
| **Start/End dates**          | All promotions must have explicit start and end dates/times               |
| **Timezone**                 | East Africa Time (EAT / UTC+3)                                            |
| **Price at checkout**        | Promotional price applies only if order is placed during promotion window |
| **No retroactive discounts** | Orders placed before or after promotion window receive standard pricing   |

### 3.5 Prohibited Discount Practices

The following are **NOT allowed**:

- Discounts that result in selling below cost (negative margin)
- Discounts applied post-purchase
- Undocumented or verbal discounts
- Discounts negotiated individually with customers (fixed price only)
- Discounts greater than 50% of product price (requires CEO approval)

---

## 4. Delivery Fees

### 4.1 Delivery Fee Structure

| Zone                               | Coverage                                                         | Standard Fee                         |
| ---------------------------------- | ---------------------------------------------------------------- | ------------------------------------ |
| **Zone 1: Nairobi CBD & Environs** | CBD, Westlands, Kilimani, Karen, Lavington, Hurlingham           | KES 300                              |
| **Zone 2: Greater Nairobi**        | Thika, Ruiru, Juja, Kiambu, Ngong, Rongai, Kitengela, Athi River | KES 500                              |
| **Zone 3: Other Major Towns**      | Mombasa, Kisumu, Nakuru, Eldoret (via courier)                   | KES 800                              |
| **Zone 4: Rest of Kenya**          | All other locations (via courier)                                | KES 1,000 – 1,500 (quoted per order) |

### 4.2 Free Delivery Threshold

| Condition           | Applies To        |
| ------------------- | ----------------- |
| Orders ≥ KES 15,000 | Zone 1 only       |
| Orders ≥ KES 25,000 | Zone 1 and Zone 2 |

> [!NOTE]
> Free delivery does not apply to Zone 3 or Zone 4 in v1.

### 4.3 Large/Bulky Item Surcharge

| Item Type                       | Surcharge       |
| ------------------------------- | --------------- |
| TVs 55" and above               | + KES 500       |
| Desktop computers / All-in-Ones | + KES 300       |
| Multiple large items (3+)       | + KES 500 total |

### 4.4 Delivery Fee on Refunds and Failures

| Scenario                                       | Delivery Fee Treatment                                            |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| **Customer-initiated refund (change of mind)** | Delivery fee is NOT refunded                                      |
| **Defective product return**                   | Delivery fee IS refunded                                          |
| **Failed delivery (customer unavailable)**     | First re-attempt free; second re-attempt charged at standard rate |
| **Failed delivery (wrong address provided)**   | Customer charged for re-delivery                                  |
| **Order cancellation before dispatch**         | Delivery fee IS refunded                                          |

---

## 5. Payment Methods & Rules

### 5.1 Payment Methods Supported (MVP)

| Method                     | Status    | Description                                              |
| -------------------------- | --------- | -------------------------------------------------------- |
| **MPesa (STK Push)**       | Primary   | Customer receives push notification to confirm payment   |
| **MPesa (Paybill Manual)** | Fallback  | Customer initiates payment manually using Paybill number |
| **Card Payments**          | Phase 2   | Visa, Mastercard via payment gateway                     |
| **Pay on Delivery (PoD)**  | Secondary | Cash payment upon delivery (restricted)                  |

### 5.2 MPesa Rules

| Rule                  | Value                                                                        |
| --------------------- | ---------------------------------------------------------------------------- |
| **Transaction Limit** | Per MPesa limits (currently KES 150,000 per transaction)                     |
| **Order above limit** | Customer must split payment (multiple MPesa transactions)                    |
| **Confirmation**      | Order only confirmed upon successful callback from MPesa                     |
| **Timeout handling**  | If callback not received within 5 minutes, order marked as "Payment Pending" |
| **Retry allowed**     | Customer may retry payment for pending orders                                |

### 5.3 Pay on Delivery (PoD) Rules

> [!CAUTION]
> Pay on Delivery carries fraud risk. The following restrictions apply:

| Rule                     | Value                                                    |
| ------------------------ | -------------------------------------------------------- |
| **Maximum order value**  | KES 30,000                                               |
| **Minimum order value**  | KES 2,000                                                |
| **Zone restriction**     | Zone 1 and Zone 2 only (Nairobi metro)                   |
| **Product restrictions** | Not available for phones or high-theft-risk items        |
| **Customer eligibility** | Must have valid phone number; may require ID at delivery |
| **First-time customers** | PoD may be disabled for first orders (flag for review)   |
| **Payment collection**   | Cash only (no MPesa at delivery in v1)                   |

### 5.4 Partial Payment Rules

| Rule                         | Value                                         |
| ---------------------------- | --------------------------------------------- |
| **Partial payment allowed?** | ❌ No — full payment required before dispatch |
| **Deposits**                 | Not accepted in v1                            |
| **Payment plans / BNPL**     | Not available in v1                           |

### 5.5 Payment Failure Handling

| Failure Type                | Handling                                                             |
| --------------------------- | -------------------------------------------------------------------- |
| **STK Push timeout**        | Order remains in "Pending Payment" for 24 hours, then auto-cancelled |
| **Insufficient funds**      | Customer notified; may retry                                         |
| **Wrong PIN**               | Customer notified; may retry                                         |
| **MPesa system down**       | Display fallback Paybill option; support contact displayed           |
| **Card declined (Phase 2)** | Customer notified; may retry with different card or MPesa            |

---

## 6. Refund & Cancellation Policy

### 6.1 Refund Eligibility

| Scenario                       | Refund Eligible?       | Refund Amount                                  |
| ------------------------------ | ---------------------- | ---------------------------------------------- |
| **Defective product (DOA)**    | ✅ Yes                 | Full refund including delivery fee             |
| **Wrong product delivered**    | ✅ Yes                 | Full refund including delivery fee             |
| **Product not as described**   | ✅ Yes                 | Full refund including delivery fee             |
| **Change of mind (unopened)**  | ✅ Yes (within 7 days) | Product price only (delivery fee NOT refunded) |
| **Change of mind (opened)**    | ⚠️ Case-by-case        | May be subject to restocking fee (10%)         |
| **Product damaged in transit** | ✅ Yes                 | Full refund including delivery fee             |

### 6.2 Non-Refundable Scenarios

The following are **NOT eligible for refund**:

- Products damaged by customer misuse
- Products with removed or tampered serial numbers
- Software, digital products, or activated licenses
- Products returned after 14 days of delivery
- Products without original packaging (for change of mind returns)
- Earphones, headphones (hygiene reasons — unless defective)
- Screen protectors, phone cases (once opened — unless defective)

### 6.3 Refund Timelines

| Stage                         | Timeline                                   |
| ----------------------------- | ------------------------------------------ |
| **Customer requests refund**  | Must be within 14 days of delivery         |
| **Refund review**             | Within 2 business days of receiving return |
| **Refund processing (MPesa)** | Within 3 business days of approval         |
| **Refund processing (Card)**  | Within 7 business days (depends on bank)   |
| **Refund processing (PoD)**   | Within 3 business days via MPesa           |

### 6.4 Refund Method

| Original Payment | Refund Method                                |
| ---------------- | -------------------------------------------- |
| MPesa            | Refund to same MPesa number used for payment |
| Card (Phase 2)   | Refund to same card                          |
| Pay on Delivery  | Refund via MPesa to phone number on order    |

> [!IMPORTANT]
> Refunds to a different payment method or account require manual approval.

### 6.5 Order Cancellation

| Stage                               | Cancellation Allowed?              | Refund                               |
| ----------------------------------- | ---------------------------------- | ------------------------------------ |
| **Before payment**                  | ✅ Yes (customer can abandon cart) | N/A                                  |
| **After payment, before dispatch**  | ✅ Yes                             | Full refund including delivery fee   |
| **After dispatch, before delivery** | ⚠️ Case-by-case                    | May incur cancellation fee (KES 500) |
| **After delivery**                  | Follows refund policy above        | See Section 6.1                      |

---

## 7. Warranty & After-Sales Obligations

### 7.1 Warranty Coverage

| Product Type                    | Warranty Duration | Coverage                |
| ------------------------------- | ----------------- | ----------------------- |
| **Brand New Laptops**           | 12 months         | Manufacturer defects    |
| **Ex-UK / Refurbished Laptops** | 6 months          | Functional defects only |
| **Brand New Phones**            | 12 months         | Manufacturer defects    |
| **Ex-USA Phones**               | 3 months          | Functional defects only |
| **TVs and Monitors**            | 12 months         | Manufacturer defects    |
| **Accessories**                 | 3 months          | Functional defects only |

### 7.2 Warranty Exclusions

Warranty does **NOT** cover:

- Physical damage (drops, water damage, cracked screens)
- Software issues or virus-related problems
- Damage from unauthorized repair attempts
- Normal wear and tear (battery degradation, etc.)
- Cosmetic damage (scratches, dents)
- Products with removed or tampered serial numbers

### 7.3 Warranty Claim Process

| Step | Description                                      | Timeline                           |
| ---- | ------------------------------------------------ | ---------------------------------- |
| 1    | Customer contacts support with issue description | —                                  |
| 2    | Support verifies purchase and warranty status    | Within 24 hours                    |
| 3    | Diagnostic assessment (remote or in-person)      | 1-3 business days                  |
| 4    | Decision: Repair, Replace, or Reject             | Within 5 business days             |
| 5    | Resolution executed                              | Within 7 business days of decision |

### 7.4 Repair vs Replacement Rules

| Condition                               | Action                                 |
| --------------------------------------- | -------------------------------------- |
| **Repairable defect**                   | Repair provided at no cost to customer |
| **Unrepairable defect**                 | Replacement with equivalent product    |
| **No replacement stock available**      | Full refund offered                    |
| **Customer prefers refund over repair** | At company discretion                  |

### 7.5 Customer Responsibilities

- Provide proof of purchase (order number or receipt)
- Return product in reasonable condition with all accessories
- Backup data before returning (data loss is customer's responsibility)
- Describe issue accurately

---

## 8. Accounting & Reconciliation Assumptions

### 8.1 When a Sale is Recognized

| Event                              | Revenue Recognized?                         |
| ---------------------------------- | ------------------------------------------- |
| **Cart created**                   | ❌ No                                       |
| **Order placed (pending payment)** | ❌ No                                       |
| **Payment received and confirmed** | ✅ Yes — revenue booked                     |
| **Order shipped**                  | Revenue already booked                      |
| **Order delivered**                | Revenue confirmed (delivery updates record) |

> [!NOTE]
> **Revenue recognition:** Revenue is recognized at payment confirmation, not delivery. This is consistent with prepayment models.

### 8.2 Pay on Delivery Revenue Recognition

| Event                            | Revenue Recognized?     |
| -------------------------------- | ----------------------- |
| **PoD order placed**             | ❌ No                   |
| **Order dispatched**             | ❌ No (contingent sale) |
| **Cash collected and confirmed** | ✅ Yes — revenue booked |

### 8.3 Failed and Reversed Payments

| Scenario                              | Accounting Treatment                                     |
| ------------------------------------- | -------------------------------------------------------- |
| **Payment timeout (never completed)** | No revenue recorded; order cancelled                     |
| **Payment reversal (MPesa reversal)** | Revenue adjusted; refund recorded                        |
| **Chargeback (card — Phase 2)**       | Revenue adjusted; chargeback fee recorded as expense     |
| **Refund issued**                     | Revenue reduced; refund recorded as separate transaction |

### 8.4 Daily Reconciliation Requirements

| Task                                              | Frequency | Responsibility             |
| ------------------------------------------------- | --------- | -------------------------- |
| **MPesa statement vs system transactions**        | Daily     | Finance / automated        |
| **PoD cash collected vs orders marked delivered** | Daily     | Delivery team → Finance    |
| **Outstanding "Pending Payment" orders**          | Daily     | Auto-cancel after 24 hours |
| **Refund queue processing**                       | Daily     | Finance                    |

### 8.5 End-of-Month Reconciliation

| Check                                | Description                              |
| ------------------------------------ | ---------------------------------------- |
| **Revenue vs payments received**     | Total revenue = total confirmed payments |
| **Inventory vs sales**               | Units sold matches inventory reduction   |
| **Refunds issued vs refund records** | All refunds properly recorded and traced |
| **Outstanding orders**               | No orders stuck in limbo states          |

---

## 9. Risk & Abuse Considerations

### 9.1 Fraud Risks

| Risk                         | Description                                          | Mitigation                                                       |
| ---------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| **PoD non-payment**          | Customer refuses to pay on delivery                  | Limit PoD to low-value orders; restrict for first-time customers |
| **Fake MPesa confirmations** | Fraudulent payment screenshots                       | Only trust MPesa callback; never rely on screenshots             |
| **Address fraud**            | Fake delivery addresses to steal goods               | Verify phone numbers; require ID for high-value deliveries       |
| **Identity fraud**           | Stolen MPesa accounts used for payment               | Flag unusual patterns; support reversal requests                 |
| **Promo code abuse**         | Creating multiple accounts for first-order discounts | Track by phone number and device; limit redemptions              |

### 9.2 Refund Abuse Scenarios

| Risk                     | Description                                | Mitigation                                                          |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------------------- |
| **Serial refunder**      | Customer repeatedly orders and returns     | Track refund rate per customer; flag at >3 refunds                  |
| **Wardrobing**           | Using product and returning as "unopened"  | Check for signs of use; require sealed packaging for change-of-mind |
| **Claim defect falsely** | Claiming defect when product is functional | Require diagnostic verification before refund                       |
| **Switch and return**    | Returning different/older product          | Verify serial numbers on return                                     |

### 9.3 Delivery Disputes

| Risk                      | Description                                | Mitigation                                                    |
| ------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| **"Not received" claims** | Customer claims non-delivery to get refund | Require signature/photo proof of delivery                     |
| **Wrong recipient**       | Delivery to wrong person at address        | Verify recipient name/ID for high-value orders                |
| **Damaged in transit**    | Product damaged but customer blames seller | Photograph packaging before handoff; use protective packaging |

### 9.4 Pricing Errors

| Risk                           | Description                                 | Mitigation                                               |
| ------------------------------ | ------------------------------------------- | -------------------------------------------------------- |
| **Price display error**        | Product listed at incorrect (too low) price | Reserve right to cancel orders at obvious pricing errors |
| **Promotion misconfiguration** | Discount applied incorrectly                | Require approval for discounts > 30%; audit promo setup  |
| **Currency confusion**         | Prices misinterpreted as USD                | Always display "KES" prefix; no ambiguous formats        |

### 9.5 Handling Pricing Errors

> [!CAUTION]
> **Policy on Pricing Errors**
>
> If a product is listed at an obviously incorrect price (e.g., laptop listed at KES 4,500 instead of KES 45,000), the company reserves the right to:
>
> 1. Cancel the order and issue a full refund
> 2. Contact the customer and offer the correct price
>
> This must be handled within 24 hours of order placement.

---

## Document Approval

| Role                 | Name | Status  | Date |
| -------------------- | ---- | ------- | ---- |
| Finance Lead         | —    | Pending | —    |
| Operations Lead      | —    | Pending | —    |
| Legal / Compliance   | —    | Pending | —    |
| CEO / Business Owner | —    | Pending | —    |

---

## Appendix A: Key Figures Summary

| Item                               | Value                 |
| ---------------------------------- | --------------------- |
| VAT Rate                           | 16%                   |
| Currency                           | KES (Kenyan Shilling) |
| Free Delivery Threshold (Zone 1)   | KES 15,000            |
| Free Delivery Threshold (Zone 1+2) | KES 25,000            |
| PoD Maximum Order Value            | KES 30,000            |
| PoD Minimum Order Value            | KES 2,000             |
| Refund Request Window              | 14 days from delivery |
| Payment Timeout (auto-cancel)      | 24 hours              |
| Standard Warranty (Brand New)      | 12 months             |
| Standard Warranty (Refurbished)    | 6 months              |

---

_This document serves as the financial source of truth. All payment, pricing, refund, and revenue recognition logic must align with these rules. Deviations require explicit written approval._
