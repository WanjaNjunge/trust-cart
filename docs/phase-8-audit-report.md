# TrustCart Kenya — Phase 8 MVP Audit Report

**Audit Date:** 2026-04-27
**Auditor:** Claude Code (automated codebase scan)
**Repository:** `modern-ecom` — NestJS API + Next.js frontend monorepo
**Conclusion:** Phase 8.6 complete; Phase 8.5 partially done; Phase 8.7 ~30% done

---

## Phase 8.1 — Customer Browsing

| Step | Task | Status | Evidence |
|------|------|--------|----------|
| 8.1.1 | CategoriesModule (service, controller, DTOs) | ✅ Done | `apps/api/src/modules/categories/categories.controller.ts` — GET `/categories`, GET `/categories/:slug`; `findAll()` returns tree structure |
| 8.1.2 | Product filtering (category, brand, price, condition) | ✅ Done | `apps/api/src/modules/products/products.service.ts:44-52` — all four filters applied to Prisma `where` clause |
| 8.1.3 | Product search (name, description, SKU) | ✅ Done | `apps/api/src/modules/products/products.service.ts:53-59` — `where.OR` across all three fields |
| 8.1.4 | GET /products, GET /products/{id} | ✅ Done | `products.controller.ts:11,70` |
| 8.1.5 | GET /products/slug/{slug} | ✅ Done | `products.controller.ts:86` — `@Get('slug/:slug')` |
| 8.1.6 | GET /categories | ✅ Done | `categories.controller.ts:11` — `@Get()` returns tree |
| 8.1.7 | Frontend: Home page | ✅ Done | `apps/web/src/app/page.tsx` — Hero, Categories, Popular, Features sections |
| 8.1.8 | Frontend: Category Listing | ✅ Done | `apps/web/src/app/categories/[slug]/page.tsx` — `ProductGrid` with filters |
| 8.1.9 | Frontend: Product Detail | ✅ Done | `apps/web/src/app/products/[slug]/page.tsx` — `ImageGallery` + `ProductActions` |
| 8.1.10 | Frontend: Search Results | ✅ Done | `apps/web/src/app/search/page.tsx` — `searchProducts` call, empty state |

**Phase 8.1 Result: ✅ Complete (10/10)**

---

## Phase 8.2 — Authentication

| Step | Task | Status | Evidence |
|------|------|--------|----------|
| 8.2.1 | AuthModule with JWT strategy | ✅ Done | `auth.module.ts` registered; `strategies/jwt.strategy.ts` — `PassportStrategy`, validates user from DB |
| 8.2.2 | POST /auth/register | ✅ Done | `auth.controller.ts:11` — bcrypt hash, conflict check, CUSTOMER role |
| 8.2.3 | POST /auth/login | ✅ Done | `auth.controller.ts:19` — returns `accessToken` + user |
| 8.2.4 | POST /auth/forgot-password | ⚠️ Partial | Backend exists but uses in-memory `Map` (not Redis) — stub-acceptable for MVP |
| 8.2.5 | POST /auth/reset-password | ✅ Done | `auth.controller.ts:39` — validates token, bcrypt new password |
| 8.2.6 | GET/PATCH /users/me | ✅ Done | `users.controller.ts:21,29` — `@JwtAuthGuard`, `@CurrentUser()` decorator |
| 8.2.7 | Address CRUD | ✅ Done | `users.controller.ts:37-85` — full GET/POST/PATCH/DELETE + set-default |
| 8.2.8 | Auth guards (JwtAuthGuard, RolesGuard) | ✅ Done | `common/guards/jwt-auth.guard.ts` + `roles.guard.ts` — with `Reflector` |
| 8.2.9 | Roles: CUSTOMER, STAFF, MANAGER, ADMIN | ✅ Done | `UserRole` from Prisma used throughout |
| 8.2.10 | Frontend: Register page | ✅ Done | `apps/web/src/app/register/page.tsx` |
| 8.2.11 | Frontend: Login page | ✅ Done | `apps/web/src/app/login/page.tsx` — links to `/forgot-password` |
| 8.2.12 | Frontend: Profile + Address Management | ✅ Done | `apps/web/src/app/account/page.tsx`, `account/addresses/new/`, `[id]/` |
| 8.2.13 | Frontend: Forgot/Reset Password pages | ❌ Missing | API functions exist in `lib/api.ts:175`, login links to `/forgot-password`, but **no route directory exists** — currently 404s |

**Phase 8.2 Result: ⚠️ Mostly Complete (11/13) — missing forgot/reset frontend pages**

---

## Phase 8.3 — Shopping Cart

| Step | Task | Status | Evidence |
|------|------|--------|----------|
| 8.3.1 | GET /cart | ✅ Done | `cart.controller.ts:20` — `OptionalJwtAuthGuard`, X-Session-ID header |
| 8.3.2 | POST /cart/items | ✅ Done | `cart.controller.ts:33` |
| 8.3.3 | PATCH /cart/items/{id} | ✅ Done | `cart.controller.ts:48` |
| 8.3.4 | DELETE /cart/items/{id} | ✅ Done | `cart.controller.ts:65` |
| 8.3.5 | POST /cart/promo | ✅ Done | `cart.controller.ts:80` |
| 8.3.6 | Stock validation on add/update | ✅ Done | `cart.service.ts:93-101` — `quantityOnHand - quantityReserved` vs requested |
| 8.3.7 | Inventory reservation on add | ✅ Done | `cart.service.ts:488-515` — `Reservation` record in `$transaction` |
| 8.3.8 | Cart expiry (24h guest, none for user) | ✅ Done | `cart.service.ts:59-61` |
| 8.3.9 | Frontend: Cart page | ✅ Done | `apps/web/src/app/cart/page.tsx` — items, update/remove, promo code |
| 8.3.10 | Frontend: Add to Cart on Product Detail | ✅ Done | `products/[slug]/AddToCartButton.tsx` |
| 8.3.11 | Frontend: Cart icon with count in header | ✅ Done | `Header.tsx:19,173-175` — badge with `cartCount` state |

**Phase 8.3 Result: ✅ Complete (7/7 functional items)**

---

## Phase 8.4 — Checkout Flow

| Step | Task | Status | Evidence |
|------|------|--------|----------|
| 8.4.1 | POST /checkout | ✅ Done | `orders.controller.ts:27` — `OptionalJwtAuthGuard` |
| 8.4.2 | Order number (TC-YYYY-NNNNNN) | ✅ Done | `orders.service.ts:54-68` — sequential 6-digit, zero-padded |
| 8.4.3 | Price snapshot | ✅ Done | `orders.service.ts:249-258` — `orderItem.unitPrice = item.product.price` at order time |
| 8.4.4 | Address snapshot (OrderAddress) | ✅ Done | `orders.service.ts:263-274` — creates separate `OrderAddress` record |
| 8.4.5 | OrderStatusHistory initial entry | ✅ Done | `orders.service.ts:276-285` — `PENDING_PAYMENT` entry on checkout |
| 8.4.6 | Delivery fee by zone | ✅ Done | `orders.service.ts:74-91` — county-to-zone map, 200–500 KES |
| 8.4.7 | Cart clearing after checkout | ✅ Done | `orders.service.ts:315-323` — `cartItem.deleteMany` + promo reset |
| 8.4.8 | Frontend: Single-step Checkout page | ✅ Done | `apps/web/src/app/checkout/page.tsx` — address selection, payment method, order summary |
| 8.4.9 | Separate order confirmation page | ⚠️ Partial | Inline success state in checkout page — no dedicated `/order-confirmation/[id]` route |

**Phase 8.4 Result: ✅ Functionally Complete (8/9) — confirmation inline, not a separate route**

---

## Phase 8.5 — Payment (Stub)

| Step | Task | Status | Evidence |
|------|------|--------|----------|
| 8.5.1 | POST /payments/initiate | ✅ Done | `payments.controller.ts:19` — handles MPESA_STK and POD_CASH |
| 8.5.2 | Update order status on confirmation | ✅ Done | `payments.service.ts` — order moves to CONFIRMED after stub fires |
| 8.5.3 | Stub MPesa auto-confirm after delay | ⚠️ Partial | `payments.service.ts:140-148` — raw `setTimeout` (5s), not BullMQ |
| 8.5.4 | Idempotency key validation | ⚠️ Partial | Key stored on `PaymentTransaction` but **never checked** on re-submission — duplicates not rejected |
| 8.5.5 | BullMQ queue: notifications / order.confirmed | ⚠️ Partial | `notifications` queue works; `order.confirmed` handled within it — not a dedicated queue as spec'd |
| 8.5.6 | GET /payments/{id} | ❌ Missing | No GET endpoint in `payments.controller.ts` |
| 8.5.7 | POST /webhooks/mpesa/callback | ❌ Missing | No webhook controller anywhere in codebase |
| 8.5.8 | BullMQ queue: payment.verify | ❌ Missing | Only `notifications` queue registered — no `payment.verify` queue |
| 8.5.9 | Frontend: Payment initiation modal | ⚠️ Partial | No modal UI — payment initiates inline on checkout submit |
| 8.5.10 | Frontend: Payment status polling | ❌ Missing | No polling loop after `initiatePayment()` — UI trusts initial response |
| 8.5.11 | Frontend: Order confirmation page | ⚠️ Partial | Inline success state in checkout — no separate `/order-confirmation/[id]` route |

**Phase 8.5 Result: ⚠️ Partial (4/10 fully done) — core stub flow works, significant spec gaps remain**

---

## Phase 8.6 — Order Management (Customer)

| Step | Task | Status | Evidence |
|------|------|--------|----------|
| 8.6.1 | GET /orders with pagination | ✅ Done | `orders.controller.ts:67` — `page`/`limit` query params, `meta.totalPages` |
| 8.6.2 | GET /orders/{id} with authorization | ✅ Done | `orders.controller.ts:93` — ForbiddenException if `order.userId !== userId` |
| 8.6.3 | POST /orders/{id}/cancel (before DISPATCHED) | ✅ Done | `orders.controller.ts:113` — `CUSTOMER_CANCELLABLE_STATES` enforced |
| 8.6.4 | order.status_changed event handler | ✅ Done | `notification.processor.ts:23` — handles `order.status_changed` in `notifications` queue |
| 8.6.5 | Frontend: Order History page | ✅ Done | `apps/web/src/app/orders/page.tsx` — paginated list, auth-gated |
| 8.6.6 | Frontend: Order Detail page | ✅ Done | `apps/web/src/app/orders/[id]/page.tsx` — items, address, payment, timeline |
| 8.6.7 | Frontend: Cancel button (conditional) | ✅ Done | `orders/[id]/page.tsx:209` — `canCancel` from `CANCELLABLE_STATUSES` |
| 8.6.8 | Frontend: Status timeline UI | ✅ Done | `orders/[id]/page.tsx:37-81` — `OrderStatusTimeline` with icons, timestamps |

**Phase 8.6 Result: ✅ Complete (8/8)**

---

## Phase 8.7 — Admin Operations

| Step | Task | Status | Evidence |
|------|------|--------|----------|
| 8.7.1 | AdminModule skeleton with role guard | ✅ Done | `admin.module.ts` + `admin.controller.ts:12-13` — `@Roles(ADMIN, MANAGER, STAFF)` |
| 8.7.2 | POST /admin/products | ✅ Done | `admin.products.controller.ts:25` — creates product + inventory record |
| 8.7.3 | PATCH /admin/products/{id}, deactivate | ✅ Done | `admin.products.controller.ts:44` — `productsService.remove()` → `isActive: false` |
| 8.7.4 | PATCH /admin/inventory/{productId}/adjust + StockAdjustment log | ❌ Missing | No inventory controller, route, or service method in admin module |
| 8.7.5 | PATCH /admin/orders/{id}/status (Staff+) | ❌ Missing | No admin orders controller exists at all |
| 8.7.6 | POST /admin/orders/{id}/refund (Manager+) | ❌ Missing | No refund endpoint or logic anywhere; `REFUNDED` only in frontend status config |
| 8.7.7 | Frontend: Admin Dashboard (real data) | ⚠️ Partial | Page exists and fetches `/admin/stats`, but `AdminService.getDashboardStats()` returns **hardcoded stub** — PrismaService commented out |
| 8.7.8 | Frontend: Product Management | ✅ Done | `(admin)/admin/products/page.tsx` — table, search, pagination, create/edit/delete |
| 8.7.9 | Frontend: Inventory page | ❌ Missing | Listed in `AdminSidebar.tsx` but `/admin/inventory/` directory does not exist |
| 8.7.10 | Frontend: Order Management page | ❌ Missing | Listed in `AdminSidebar.tsx` but `/admin/orders/` directory does not exist |
| 8.7.11 | Low-stock alerts (real data) | ❌ Missing | Dashboard shows `lowStock: 3` hardcoded — no Prisma query against `reorderThreshold` |

**Phase 8.7 Result: 🔧 In Progress (3/11) — active phase**

---

## Summary

### 1. Is "currently at Phase 8.7" accurate?

**Partially accurate, but overstated.** Phases 8.1, 8.3, and 8.6 are complete. Phase 8.2 and 8.4 are functionally complete with minor gaps. **Phase 8.5 was never fully resolved before moving forward** — it has significant spec gaps. Phase 8.7 is genuinely in-progress at ~30% completion.

More accurate statement: **Phase 8.6 is done; Phase 8.5 is partial; Phase 8.7 is 3/11 done.**

---

### 2. Phase 8.7 — Done vs Pending

**Done:**
- AdminModule + role guards
- POST /admin/products + PATCH /admin/products/{id}
- Admin Product Management frontend (full CRUD UI)
- Admin Dashboard frontend skeleton (fetches `/admin/stats`)

**Pending:**
1. `PATCH /admin/inventory/:productId/adjust` — entire controller missing
2. `PATCH /admin/orders/:id/status` — entire admin orders controller missing
3. `POST /admin/orders/:id/refund` — no backend logic
4. Real dashboard stats — `AdminService.getDashboardStats()` is hardcoded stub
5. `/admin/inventory/page.tsx` — sidebar link 404s
6. `/admin/orders/page.tsx` — sidebar link 404s
7. Low-stock alert from real `reorderThreshold` Prisma query

---

### 3. Gaps in Earlier Phases

| Phase | Gap | Severity |
|-------|-----|----------|
| 8.2 | `/forgot-password` and `/reset-password` frontend pages missing — login page link 404s | Should-fix |
| 8.5 | No `GET /payments/:id` endpoint for status polling | Should-fix |
| 8.5 | No frontend payment status polling loop | Should-fix |
| 8.5 | Idempotency key stored but never checked on re-submit | Should-fix |
| 8.5 | No `/webhooks/mpesa/callback` endpoint | Nice-to-have |
| 8.5 | Payment stub uses raw `setTimeout` not BullMQ | Nice-to-have |
| 8.4 | Order confirmation is inline, not a separate route | Nice-to-have |

---

### 4. Blockers for Completing 8.7 and Moving to 8.8

**Must-fix to close Phase 8.7:**

1. Create `apps/api/src/modules/admin/admin.inventory.controller.ts` — `PATCH /admin/inventory/:productId/adjust` with `AdjustInventoryDto`, write to `InventoryRecord.quantityOnHand`, create `StockAdjustment` record
2. Create `apps/api/src/modules/admin/admin.orders.controller.ts` — `PATCH /admin/orders/:id/status` (Staff+), `POST /admin/orders/:id/refund` (Manager+), emit `order.status_changed` on transitions
3. Fix `AdminService.getDashboardStats()` — replace hardcoded values with real Prisma queries (today's orders, revenue, low-stock count)
4. Create `apps/web/src/app/(admin)/admin/inventory/page.tsx`
5. Create `apps/web/src/app/(admin)/admin/orders/page.tsx`

**Should-fix before 8.8 (Phase 8.5 regressions):**

6. Add `GET /payments/:id` to `payments.controller.ts`
7. Add `/forgot-password` and `/reset-password` pages to web app
8. Add frontend payment status polling in `checkout/page.tsx`
9. Add idempotency re-submission check in `payments.service.ts`
