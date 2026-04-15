# Product Vision & Scope

**Document Status:** Draft — Pending Human Sign-off  
**Last Updated:** 2026-01-18  
**Version:** 1.0

---

## 1. Product Name (Working)

**TrustCart Kenya**

_Rationale:_ The name signals reliability ("Trust") and shopping ("Cart"), directly addressing the core differentiator in a market where customer confidence is the primary barrier to online purchasing.

---

## 2. Vision Statement

TrustCart Kenya is an online electronics retail platform serving individual consumers and small businesses in Kenya. It exists to provide a trustworthy, transparent, and reliable way to purchase electronics — eliminating the fear of scams, payment failures, and unfulfilled deliveries that plague the Kenyan e-commerce landscape.

The platform sells curated, quality-verified electronics with honest product descriptions, confirmed MPesa payments, and accountable delivery. We aim to be the store customers recommend to their family with confidence.

---

## 3. Target Users

### Primary Users

**Individual Consumers in Urban Kenya (Nairobi, Mombasa, Kisumu)**

- Age 25–45, employed or self-employed
- Comfortable with smartphones and MPesa
- Seeking laptops, phones, TVs, and accessories for personal or home use
- **Pain points:**
  - Fear of paying and not receiving goods
  - Uncertainty about product quality (new vs. refurbished, genuine vs. counterfeit)
  - Poor customer service and no recourse after purchase
  - Complex or failed payment experiences

### Secondary Users

**Small Business Owners / Procurement Officers**

- Purchasing equipment for offices (computers, monitors, printers)
- Need invoices and bulk order capability
- Value consistency and vendor reliability over lowest price

---

## 4. Core Problems We Are Solving

| #   | Problem                               | Context                                                                                                                                                         |
| --- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Trust deficit in online purchases** | Many Kenyan e-commerce sites have poor reputations — customers pay and receive nothing, or receive counterfeit goods. There is no reliable recourse.            |
| 2   | **Payment friction**                  | MPesa is dominant, but many sites handle it poorly — unclear confirmation, failed callbacks, no receipts. Customers are left wondering if payment went through. |
| 3   | **Delivery uncertainty**              | Customers don't know when or if items will arrive. Tracking is often unavailable or unreliable. Failed deliveries result in lost goods or lengthy disputes.     |
| 4   | **Product misrepresentation**         | "New" products turn out to be refurbished. Specifications are inaccurate. Photos don't match items received.                                                    |
| 5   | **No accountability**                 | When problems occur, there is no clear complaint process, no refund path, and customer service is unresponsive.                                                 |

---

## 5. Value Proposition

TrustCart Kenya is the electronics store for customers who have been burned before — or fear they will be.

**We offer:**

1. **Verified Payments** — MPesa transactions are confirmed before orders proceed. Customers receive clear receipts and can track payment status.

2. **Honest Product Listings** — Every product clearly states its condition (new, certified refurbished, ex-USA). Specifications are accurate. Photos represent actual inventory.

3. **Accountable Delivery** — Orders include tracking. Delivery windows are realistic. Failed deliveries trigger automatic customer notification and resolution.

4. **Real Customer Support** — Customers can reach a human. Disputes have a defined resolution path. Refunds are possible.

5. **No Marketplace Risk** — Inventory is controlled by us. Customers are not transacting with unknown third-party sellers.

**In short:** When you buy from TrustCart, you get what you paid for, or you get your money back.

---

## 6. MVP Scope (Phase 1)

The following capabilities are **required** for initial launch. Anything not listed here is explicitly out of MVP scope.

### Storefront

- [ ] Product catalog with categories (Laptops, Phones, TVs, Accessories)
- [ ] Product detail pages with specifications, condition, price, and images
- [ ] Search functionality (basic keyword search)
- [ ] Category browsing and filtering (by brand, price range, condition)

### Customer Accounts

- [ ] Customer registration and login (email/password)
- [ ] Password reset via email
- [ ] Customer profile with saved contact and delivery information
- [ ] Order history visible to customer

### Shopping & Checkout

> [!NOTE]
> **Guest Checkout Supported:** All shopping and checkout functionality is available to both anonymous (guest) users and logged-in users. Account creation is encouraged but not required to complete a purchase.

> [!IMPORTANT]
> **Amendment (2026-02-08):** While guest checkout is fully supported, viewing order history at `/orders` requires authentication. Guest checkout users receive order confirmation via email. Session-based order viewing is deferred to Phase 8.7.

- [ ] Add to cart / remove from cart (available to all users)
- [ ] Cart persistence:
  - Logged-in users: cart persists across sessions and devices
  - Guest users: cart persists via browser session/local storage
- [ ] Guest checkout with email capture (no account required)
- [ ] Optional account creation during or after checkout
- [ ] Single-step checkout (shipping address, phone number, payment method)
- [ ] Order confirmation page and email (email required for all orders)

### Payments

- [ ] MPesa STK Push integration (primary payment method)
- [ ] Payment confirmation and receipt generation
- [ ] Clear handling of payment failures with customer messaging

### Orders & Fulfillment

- [ ] Order creation upon successful payment
- [ ] Order status tracking (Pending → Confirmed → Shipped → Delivered)
- [ ] Admin ability to update order status
- [ ] Delivery address capture and validation (Kenya only)

### Admin Operations

- [ ] Product management (add, edit, deactivate products)
- [ ] Inventory tracking (quantity on hand, low-stock alerts)
- [ ] Order management (view orders, update status, add notes)
- [ ] Basic dashboard (orders today, revenue today)

### Trust & Transparency

- [ ] Clear return and refund policy published on site
- [ ] Contact information and business registration visible
- [ ] SSL/HTTPS across all pages

---

## 7. Future Phases (Explicitly Deferred)

The following features are **intentionally excluded** from MVP and planned for later phases:

### Phase 2 (Post-Launch Iteration)

- **Alternative payment methods:** Card payments (Visa/Mastercard), bank transfers
- **Wishlist functionality**
- **Product reviews and ratings**
- **SMS notifications** (order updates via SMS)
- **Promotional codes and discounts**
- **Multiple delivery address management**

### Phase 3 (Growth Features)

- **Marketplace model:** Third-party sellers with vetting and commission
- **Loyalty program / customer rewards**
- **Bulk ordering for businesses** with invoicing
- **Buy now, pay later (BNPL)** integration
- **Mobile app** (iOS/Android)

### Phase 4 (Advanced Operations)

- **Warehouse management system integration**
- **Automated logistics provider routing**
- **Returns and refunds self-service portal**
- **Advanced analytics and reporting dashboard**
- **Multi-currency support**

---

## 8. Non-Goals (Out of Scope)

The following are **explicitly not** goals for this product, and should not influence MVP decisions:

| Non-Goal                                          | Rationale                                                                     |
| ------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Marketplace / multi-seller model**              | Introduces trust complexity. We control inventory in v1 to guarantee quality. |
| **International shipping**                        | Focus is Kenya-only. Cross-border logistics is a separate problem.            |
| **Mobile applications**                           | Web-first. Responsive design serves mobile users adequately for MVP.          |
| **Auction or bidding features**                   | Fixed pricing only. Auctions add complexity and user confusion.               |
| **Cryptocurrency payments**                       | Not a customer need in target market. Adds regulatory and operational risk.   |
| **Social features**                               | No user-generated content, forums, or social sharing in v1.                   |
| **Comparison shopping tools**                     | We sell our own inventory, not aggregating from competitors.                  |
| **Real-time chat support**                        | Email/phone support is sufficient for MVP. Live chat adds operational burden. |
| **Advanced personalization / AI recommendations** | Premature optimization. Focus on core catalog and search first.               |

---

## 9. Success Criteria

The MVP will be considered successful if the following outcomes are achieved within **90 days of launch**:

### Customer Acquisition

- **100+ completed orders** from at least 75 unique customers
- **Repeat purchase rate** of at least 15% (customers who order more than once)

### Operational Reliability

- **Payment success rate ≥ 95%** (successful MPesa transactions / total attempts)
- **Order fulfillment rate ≥ 98%** (orders shipped within promised window)
- **Zero financial discrepancies** between recorded payments and actual receipts

### Customer Trust

- **Customer complaint rate < 5%** of orders
- **All complaints responded to within 24 hours**
- **Refund requests processed within 3 business days**

### Technical Stability

- **Site uptime ≥ 99.5%** during operating hours
- **Zero critical security incidents** (data breaches, payment fraud)
- **Page load time < 3 seconds** on mobile networks

### Business Viability

- **Positive gross margin per order** (revenue exceeds COGS + fulfillment cost)
- **Customer acquisition cost** trackable and within budget

---

## Assumptions & Dependencies

> [!IMPORTANT]
> **Stated Assumptions**
>
> The following assumptions were made in drafting this document and require confirmation:
>
> 1. **Inventory model:** The business controls its own inventory (not a marketplace). Products are purchased wholesale or on consignment and stored before sale.
> 2. **Geographic scope:** Initial operations are limited to Kenya, with primary focus on Nairobi and surrounding areas for delivery.
> 3. **Payment landscape:** MPesa is the dominant payment method. Card payments are lower priority for the target customer segment.
> 4. **Business registration:** The business has or will obtain appropriate Kenyan business registration (including tax compliance) before launch.
> 5. **Logistics:** Delivery will initially use third-party courier services, not in-house logistics.

---

## Document Approval

| Role                 | Name | Status  | Date |
| -------------------- | ---- | ------- | ---- |
| Product Owner        | —    | Pending | —    |
| Technical Lead       | —    | Pending | —    |
| Business Stakeholder | —    | Pending | —    |

---

_This document serves as a source of truth for MVP scope. Any feature not explicitly included in Section 6 requires explicit approval before implementation._
