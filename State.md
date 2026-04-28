# TrustCart Kenya — Project State

**Last updated:** 2026-04-27
**Current phase:** 8.7 (Admin Operations) — In Progress (~30%)
**Next milestone:** Close Phase 8.7 → begin Phase 8.8 (Integration & QA)

---

## Section 1: Phase Status Overview

| Phase | Name | Status | Completion | Notes |
|-------|------|--------|------------|-------|
| 8.1 | Customer Browsing | ✅ Complete | 10/10 | — |
| 8.2 | Authentication | ⚠️ Mostly Complete | 11/13 | Missing frontend: `/forgot-password`, `/reset-password` pages (backend works) |
| 8.3 | Shopping Cart | ✅ Complete | 7/7 | — |
| 8.4 | Checkout Flow | ✅ Functional | 8/9 | Order confirmation inline in checkout, not a separate route |
| 8.5 | Payment (Stub) | ⚠️ Partial | 4/10 | Core stub flow works; significant spec gaps — see Section 3 |
| 8.6 | Order Management | ✅ Complete | 8/8 | — |
| 8.7 | Admin Operations | 🔧 In Progress | 3/11 | **Active phase** |
| 8.8 | Integration & QA | ⏳ Not Started | 0/9 | Blocked by 8.7 |

---

## Section 2: Current Sprint — Phase 8.7 Remaining Work

### Item 1 — Admin Inventory Controller + Adjustment Endpoint
**Step:** 8.7.3 (inventory adjust) + 8.7.11 (low-stock from real data)
**Risk:** 🔴 High — inventory writes require audit trail

**Backend files to create:**
- `apps/api/src/modules/admin/admin.inventory.controller.ts`
  - `PATCH /admin/inventory/:productId/adjust`
  - Guards: `@Roles(ADMIN, MANAGER, STAFF)`
- `apps/api/src/modules/admin/admin.inventory.service.ts` (or add to `admin.service.ts`)
  - `adjustInventory(productId, dto)` — Prisma `$transaction`:
    1. Update `InventoryRecord.quantityOnHand += dto.quantity`
    2. Create `StockAdjustment` record (reference, reason, adjustedBy)
- DTO: `AdjustInventoryDto` — fields: `quantity: number`, `adjustmentType: string`, `reference: string`, `reason?: string`

**Files to modify:**
- `apps/api/src/modules/admin/admin.module.ts` — add new controller + service to providers/controllers

**Dependencies:** None — InventoryRecord and StockAdjustment models already exist in schema

---

### Item 2 — Admin Orders Controller (Status Update + Refund)
**Step:** 8.7.4 (order status) + 8.7.5 (refund)
**Risk:** 🔴 High — requires approval for any refund logic changes

**Backend files to create:**
- `apps/api/src/modules/admin/admin.orders.controller.ts`
  - `GET /admin/orders` — paginated, filterable by status (Staff+)
  - `PATCH /admin/orders/:id/status` — valid transitions only (Staff+)
  - `POST /admin/orders/:id/refund` — creates Refund record (Manager+)
- `apps/api/src/modules/admin/admin.orders.service.ts`
  - `findAll(query)` — paginated orders for admin view
  - `updateStatus(orderId, dto, actingUser)`:
    1. Validate transition against order lifecycle
    2. Update `Order.status`
    3. Create `OrderStatusHistory` entry (reason required)
    4. Enqueue `order.status_changed` to `notifications` queue
  - `initiateRefund(orderId, dto, actingUser)`:
    1. Check Manager+ role
    2. Create `Refund` record (status: PENDING)
    3. Log to audit trail

**DTOs to create:**
- `UpdateOrderStatusDto` — `status: OrderStatus`, `reason: string`
- `InitiateRefundDto` — `amount: number`, `reason: string`

**Files to modify:**
- `apps/api/src/modules/admin/admin.module.ts` — import `OrdersModule` or `PrismaModule` and add new controller/service

**Dependencies:** Relies on `OrdersModule` or direct `PrismaService` access

---

### Item 3 — Fix AdminService Dashboard Stats
**Step:** 8.7.6 (real dashboard data)
**Risk:** 🟢 Low — read-only Prisma queries

**File to modify:**
- `apps/api/src/modules/admin/admin.service.ts`
  - Uncomment `PrismaService` constructor injection
  - Replace hardcoded stub with real Prisma queries:
    - `orders.total` — `prisma.order.count()`
    - `orders.pending` — `prisma.order.count({ where: { status: 'PENDING_PAYMENT' } })`
    - `revenue.total` — `prisma.order.aggregate({ _sum: { totalAmount: true } })`
    - `products.lowStock` — `prisma.inventoryRecord.count({ where: { quantityOnHand: { lte: prisma raw ref reorderThreshold } } })`
    - `customers.total` — `prisma.user.count({ where: { role: 'CUSTOMER' } })`
- `apps/api/src/modules/admin/admin.module.ts` — ensure `PrismaModule` is in imports (already is)

---

### Item 4 — Admin Inventory Frontend Page
**Step:** 8.7.8
**Risk:** 🟢 Low

**Files to create:**
- `apps/web/src/app/(admin)/admin/inventory/page.tsx`
  - Product list with current `quantityOnHand`, `reorderThreshold`
  - Low-stock rows highlighted (when `quantityOnHand <= reorderThreshold`)
  - Adjust stock modal/form — calls `PATCH /admin/inventory/:productId/adjust`
  - Requires `'use client'` for modal state

**API function to add in `apps/web/src/lib/api.ts`:**
- `adjustInventory(productId, dto)` — `PATCH /admin/inventory/:productId/adjust`
- `getAdminInventory(query)` — fetches products with inventory data

---

### Item 5 — Admin Orders Frontend Page
**Step:** 8.7.9
**Risk:** 🟢 Low

**Files to create:**
- `apps/web/src/app/(admin)/admin/orders/page.tsx`
  - Orders table: order number, customer, status, total, date
  - Status filter dropdown (all, pending, confirmed, dispatched, etc.)
  - Pagination
  - Status update dropdown per row (valid transitions only)
  - Refund button — only for Manager+ role, requires confirmation dialog
  - Calls `PATCH /admin/orders/:id/status` and `POST /admin/orders/:id/refund`

**API functions to add in `apps/web/src/lib/api.ts`:**
- `getAdminOrders(query)` — `GET /admin/orders`
- `updateOrderStatus(orderId, dto)` — `PATCH /admin/orders/:id/status`
- `initiateRefund(orderId, dto)` — `POST /admin/orders/:id/refund`

---

## Section 3: Technical Debt (Pre-8.8 Fixes)

| Priority | Phase | Item | Description |
|----------|-------|------|-------------|
| Should-fix | 8.5 | `GET /payments/:id` | No endpoint for payment status lookup — required for frontend polling |
| Should-fix | 8.5 | Payment status polling | Frontend doesn't poll after MPesa initiation — user sees immediate success |
| Should-fix | 8.5 | Idempotency check | Key stored on `PaymentTransaction` but never validated on re-submit — duplicates not rejected |
| Should-fix | 8.2 | Forgot/Reset password pages | `/forgot-password` and `/reset-password` routes 404 — backend logic works, frontend missing |
| Nice-to-have | 8.4 | Separate confirmation page | `checkout/page.tsx` inline success — no dedicated `/order-confirmation/[id]` route |
| Nice-to-have | 8.5 | BullMQ for payment.verify | Stub currently uses raw `setTimeout` — not reliable across restarts |
| Nice-to-have | 8.5 | Webhook endpoint | `POST /webhooks/mpesa/callback` not implemented |

---

## Section 4: Suggested Execution Order for Remaining 8.7 Work

```
Step 1: Backend — admin.inventory.controller.ts + service
  → PATCH /admin/inventory/:productId/adjust
  → AdjustInventoryDto (quantity, adjustmentType, reference, reason)
  → Prisma $transaction: update InventoryRecord + create StockAdjustment
  → Wire into admin.module.ts

Step 2: Backend — admin.orders.controller.ts + service
  → GET /admin/orders (paginated, status filter)
  → PATCH /admin/orders/:id/status (Staff+, valid transitions, reason required)
  → POST /admin/orders/:id/refund (Manager+, creates Refund record)
  → Emit order.status_changed to notifications queue on every transition
  → Wire into admin.module.ts

Step 3: Backend — Fix AdminService.getDashboardStats()
  → Uncomment PrismaService
  → Real queries: today's orders count, total revenue, low-stock count,
    total customers, total products

Step 4: Frontend — /admin/inventory/page.tsx
  → Product list with stock levels
  → Low-stock row highlighting (quantityOnHand <= reorderThreshold)
  → Adjust stock modal → POST to PATCH /admin/inventory/:id/adjust

Step 5: Frontend — /admin/orders/page.tsx
  → Orders table with status filter + pagination
  → Status update per row (valid transitions only)
  → Refund button (Manager+ only, confirmation dialog required)
```

---

## Section 5: Next Phase Preview — Phase 8.8 (Integration & QA)

| Step | Task | Notes |
|------|------|-------|
| 8.8.1 | Run full E2E test suite | All user journey tests must pass |
| 8.8.2 | Fix any broken flows identified | Issues from E2E run |
| 8.8.3 | Lighthouse audit (desktop + mobile) | Target: score > 80 all categories |
| 8.8.4 | API response time check | All endpoints < 500ms |
| 8.8.5 | Security audit (auth, CORS, XSS) | No critical issues |
| 8.8.6 | Update Swagger documentation | All endpoints documented |
| 8.8.7 | Update README with setup instructions | New dev onboarding < 15 min |
| 8.8.8 | Deploy to Dev environment | All services running |
| 8.8.9 | Smoke test in Dev | Core flows verified |

**Pre-conditions for 8.8:**
- Phase 8.7 all 11 items complete
- Should-fix technical debt items resolved (Section 3)
- TypeScript and lint clean across all packages
