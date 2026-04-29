# Phase 8.7 Testing & Verification Guide

**Date:** 2026-04-29
**Phase:** 8.7 — Admin Operations
**Scope:** Admin Dashboard stats, Inventory management, Order status updates, Refund initiation

---

## Prerequisites

```
Docker Desktop: running
Terminal: open at project root (modern-ecom/)
Browser: http://localhost:3000
API: http://localhost:3001
```

---

## 0 — Start the Environment

**Step 0.1 — Verify Docker containers**

In Docker Desktop confirm these containers are running:
- `trustcart-postgres`
- `trustcart-redis`

If not, run:
```bash
pnpm docker:up
```

**Step 0.2 — Run migrations and seed**

```bash
pnpm db:migrate
pnpm db:seed
```

Expected output ends with:
```
✅ Seeding complete!
Test credentials: any email with password "Test123!"
```

**Step 0.3 — Start servers**

```bash
pnpm dev
```

Wait until both lines appear:
```
[API]  Application is running on: http://localhost:3001/api/v1
[Web]  ▲ Next.js ready on http://localhost:3000
```

**Test accounts (all use password `Test123!`):**

| Email | Role | Can do |
|-------|------|--------|
| `admin@trustcart.co.ke` | ADMIN | Everything |
| `manager@trustcart.co.ke` | MANAGER | Status updates + refunds |
| `staff@trustcart.co.ke` | STAFF | Status updates only, no refunds |
| `john.doe@example.com` | CUSTOMER | Should be blocked from all admin endpoints |

---

## 1 — Admin Dashboard (Step 8.7.6)

**Goal:** Verify real data replaces the old hardcoded stub.

**Step 1.1 — Login as admin in the browser**

1. Go to `http://localhost:3000/login`
2. Enter `admin@trustcart.co.ke` / `Test123!`
3. Navigate to `http://localhost:3000/admin`

**What to verify:**

| Element | Expected | Fail condition |
|---------|----------|----------------|
| Dashboard loads | Stats cards visible | Page shows "Failed to load dashboard." |
| Total Orders | A real number (not `45`) | Shows `45` — old stub still running |
| Total Customers | ≥ 2 (from seed) | Shows `850` — old stub still running |
| Low Stock Items | A real number (may be 0) | Shows `3` — old stub still running |
| Total Revenue | Number in KSh (may be 0 if no orders) | Shows `1,250,000` — old stub |

**Step 1.2 — Verify via API directly**

Open a new terminal and run:
```bash
# Get a token first
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trustcart.co.ke","password":"Test123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

curl -s http://localhost:3001/api/v1/admin/stats \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool
```

Expected response shape (values will reflect actual DB data):
```json
{
  "revenue": { "total": 0, "trend": 0 },
  "orders": { "total": 0, "pending": 0, "trend": 0 },
  "products": { "total": 12, "lowStock": 0 },
  "customers": { "total": 2, "new": 0 },
  "recentOrders": []
}
```

✅ Pass: Values match actual DB data, not hardcoded numbers.

---

## 2 — Admin Inventory: List (Step 8.7.8)

**Step 2.1 — Navigate to Inventory page**

1. In the admin sidebar, click **Inventory**
2. URL should be `http://localhost:3000/admin/inventory`

**What to verify:**

| Element | Expected |
|---------|----------|
| Page renders | Table of products visible, not a 404 |
| Each row shows | Product name, SKU, On Hand, Reserved, Available, Reorder At |
| Low stock rows | Highlighted red if `quantityOnHand ≤ reorderThreshold` (5 by default) |
| Search | Type a product name → table filters within 400ms |
| Adjust button | Visible on every row |

**Step 2.2 — Verify via API**

```bash
curl -s "http://localhost:3001/api/v1/admin/inventory?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool
```

Expected response shape:
```json
{
  "data": [
    {
      "productId": "...",
      "productName": "Samsung Galaxy S24",
      "sku": "...",
      "quantityOnHand": 12,
      "quantityReserved": 0,
      "quantityAvailable": 12,
      "reorderThreshold": 5,
      "isLowStock": false
    }
  ],
  "pagination": { "page": 1, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false }
}
```

**Step 2.3 — Role block check**

```bash
CUSTOMER_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"Test123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

curl -s http://localhost:3001/api/v1/admin/inventory \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

Expected: `{"statusCode":403,"message":"Forbidden resource"}`

---

## 3 — Admin Inventory: Adjust Stock (Step 8.7.3)

**Step 3.1 — Get a product ID to test with**

```bash
PRODUCT_ID=$(curl -s "http://localhost:3001/api/v1/admin/inventory?limit=1" \
  -H "Authorization: Bearer $TOKEN" \
  | grep -o '"productId":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Testing with product: $PRODUCT_ID"
```

Note the `quantityOnHand` value shown before adjusting.

**Step 3.2 — Add stock (positive delta)**

```bash
curl -s -X PATCH \
  "http://localhost:3001/api/v1/admin/inventory/$PRODUCT_ID/adjust" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 10,
    "adjustmentType": "PURCHASE",
    "reason": "Testing — received new stock",
    "reference": "PO-TEST-001"
  }' | python -m json.tool
```

Expected response:
```json
{
  "productId": "...",
  "productName": "...",
  "previousQuantity": 12,
  "newQuantity": 22,
  "adjustmentType": "PURCHASE",
  "reason": "Testing — received new stock",
  "reference": "PO-TEST-001"
}
```

**Step 3.3 — Verify StockAdjustment audit record**

```bash
docker exec -it trustcart-postgres psql -U trustcart -d trustcart_dev \
  -c "SELECT product_id, type, quantity, reason, reference_id, admin_id, created_at FROM stock_adjustments ORDER BY created_at DESC LIMIT 3;"
```

Expected: row with `type=PURCHASE`, `quantity=10`, `admin_id` set to the admin user's ID.

Alternatively, open Prisma Studio:
```bash
pnpm db:studio
```
Navigate to `http://localhost:5555` → **StockAdjustment** table.

**Step 3.4 — Remove stock**

```bash
curl -s -X PATCH \
  "http://localhost:3001/api/v1/admin/inventory/$PRODUCT_ID/adjust" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": -5,
    "adjustmentType": "DAMAGE",
    "reason": "Testing — damaged goods written off"
  }' | python -m json.tool
```

Expected: `newQuantity` = result from Step 3.2 − 5. A second `StockAdjustment` record created.

**Valid `adjustmentType` values:**

| Value | When to use |
|-------|-------------|
| `PURCHASE` | New stock received from supplier |
| `SALE` | Manual stock-out (non-order) |
| `RETURN` | Customer return restoring stock |
| `DAMAGE` | Damaged / written-off units |
| `CORRECTION` | Physical recount correction |

**Step 3.5 — Negative stock rejected**

```bash
curl -s -X PATCH \
  "http://localhost:3001/api/v1/admin/inventory/$PRODUCT_ID/adjust" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": -99999,
    "adjustmentType": "CORRECTION",
    "reason": "Should be rejected"
  }'
```

Expected: `{"statusCode":400,"message":"Adjustment would result in negative stock..."}`

**Step 3.6 — Validation: missing required fields**

```bash
curl -s -X PATCH \
  "http://localhost:3001/api/v1/admin/inventory/$PRODUCT_ID/adjust" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 5}'
```

Expected: `{"statusCode":400}` with validation errors listing missing `adjustmentType` and `reason`.

**Step 3.7 — Browser test of Adjust modal**

1. Go to `http://localhost:3000/admin/inventory`
2. Click **Adjust** on any row
3. Modal opens showing: product name, SKU, current stock
4. Enter: quantity `5`, type `Recount / Correction`, reason `Browser test`
5. Click **Save Adjustment**
6. Modal closes, table reloads, stock count updated, green toast: "Stock adjusted successfully"

---

## 4 — Admin Orders: List (Step 8.7.9)

**Step 4.1 — Create a test order if none exist**

If `recentOrders` was empty in step 1.2, create one now:

1. Open a new incognito window → `http://localhost:3000`
2. Browse to any product → Add to Cart → Checkout
3. Select **Pay on Delivery** to skip the payment flow
4. Complete checkout and note the order number (e.g. `TC-2026-000001`)

**Step 4.2 — Navigate to Orders page**

1. In admin sidebar (logged in as admin), click **Orders**
2. URL: `http://localhost:3000/admin/orders`

**What to verify:**

| Element | Expected |
|---------|----------|
| Table renders | Orders visible, not a 404 |
| Each row shows | Order number, Customer, Date, Status badge, Total, Action buttons |
| Status filter | Select "PENDING PAYMENT" → table filters to matching orders |
| Search | Type an order number → matching row appears |
| Guest orders | Customer column shows "Guest" for non-logged-in checkout |

**Step 4.3 — Verify via API**

```bash
curl -s "http://localhost:3001/api/v1/admin/orders?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool
```

Note an `id` value from the response for the next steps.

---

## 5 — Admin Orders: Status Update (Step 8.7.4)

**Step 5.1 — Get an order in PENDING_PAYMENT**

```bash
ORDER_ID=$(curl -s \
  "http://localhost:3001/api/v1/admin/orders?status=PENDING_PAYMENT&limit=1" \
  -H "Authorization: Bearer $TOKEN" \
  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Order ID: $ORDER_ID"
```

**Step 5.2 — Valid transition: PENDING_PAYMENT → CONFIRMED**

```bash
curl -s -X PATCH \
  "http://localhost:3001/api/v1/admin/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"CONFIRMED","reason":"Payment verified manually by admin"}' \
  | python -m json.tool
```

Expected:
```json
{
  "orderId": "...",
  "orderNumber": "TC-2026-000001",
  "previousStatus": "PENDING_PAYMENT",
  "newStatus": "CONFIRMED"
}
```

**Step 5.3 — Verify OrderStatusHistory record**

```bash
docker exec -it trustcart-postgres psql -U trustcart -d trustcart_dev \
  -c "SELECT from_status, to_status, changed_by_type, reason, created_at FROM order_status_history WHERE order_id = '$ORDER_ID' ORDER BY created_at DESC LIMIT 5;"
```

Expected: row with `from_status=PENDING_PAYMENT`, `to_status=CONFIRMED`, `changed_by_type=STAFF`, reason populated.

**Step 5.4 — Invalid transition rejected**

```bash
curl -s -X PATCH \
  "http://localhost:3001/api/v1/admin/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"CREATED","reason":"Trying to go backwards"}'
```

Expected: `{"statusCode":400,"message":"Invalid transition: CONFIRMED → CREATED. Allowed: [PROCESSING, CANCELLED]"}`

**Step 5.5 — Reason field required**

```bash
curl -s -X PATCH \
  "http://localhost:3001/api/v1/admin/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"PROCESSING"}'
```

Expected: `{"statusCode":400}` with validation error for missing `reason`.

**Step 5.6 — Staff can update status**

```bash
STAFF_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@trustcart.co.ke","password":"Test123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

curl -s -X PATCH \
  "http://localhost:3001/api/v1/admin/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"PROCESSING","reason":"Staff moving to processing"}'
```

Expected: `{"newStatus":"PROCESSING",...}` — Staff can update.

**Valid status transition table:**

| From | Allowed next statuses |
|------|-----------------------|
| PENDING_PAYMENT | CONFIRMED, PAYMENT_FAILED, CANCELLED |
| PAYMENT_FAILED | PENDING_PAYMENT, CANCELLED |
| CONFIRMED | PROCESSING, CANCELLED |
| PROCESSING | READY_FOR_PICKUP, DISPATCHED, CANCELLED |
| READY_FOR_PICKUP | DISPATCHED, CANCELLED |
| DISPATCHED | OUT_FOR_DELIVERY, CANCELLED |
| OUT_FOR_DELIVERY | DELIVERED, DELIVERY_FAILED |
| DELIVERY_FAILED | OUT_FOR_DELIVERY, CANCELLED |
| RETURN_REQUESTED | RETURN_APPROVED, RETURN_REJECTED |
| RETURN_APPROVED | RETURN_RECEIVED |
| RETURN_RECEIVED | REFUND_PENDING |
| REFUND_PENDING | REFUNDED |

**Step 5.7 — Browser test**

1. Go to `http://localhost:3000/admin/orders`
2. Find an order with valid next statuses
3. Click **Update** → modal opens showing only the valid next statuses in the dropdown
4. Select a status, enter a reason, click **Update Status**
5. Table reloads, status badge updates, green toast appears
6. Try clicking **Update** on an order in `DELIVERED` or `CANCELLED` — button should not appear (no valid next states)

---

## 6 — Admin Orders: Refund (Step 8.7.5)

> **Note:** Refunds require a confirmed `PaymentTransaction` on the order. POD (Pay on Delivery) orders will return `400 "No confirmed payment transaction found"` because no payment record is created. To test refunds, use an order placed with MPesa STK (stub) which auto-confirms. Alternatively, see Step 6.0 below.

**Step 6.0 — Create an order with a confirmed payment (if needed)**

1. As a customer in the browser, go through checkout and select **MPesa STK Push**
2. The stub auto-confirms after ~5 seconds
3. The order will move to `CONFIRMED` status automatically

Then in the admin terminal, find that order:
```bash
CONFIRMED_ORDER=$(curl -s \
  "http://localhost:3001/api/v1/admin/orders?status=CONFIRMED&limit=1" \
  -H "Authorization: Bearer $TOKEN" \
  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Confirmed order: $CONFIRMED_ORDER"
```

**Step 6.1 — Staff cannot refund**

```bash
curl -s -X POST \
  "http://localhost:3001/api/v1/admin/orders/$CONFIRMED_ORDER/refund" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":1000,"reason":"Staff attempting refund — should be blocked"}'
```

Expected: `{"statusCode":403,...}` — Staff is blocked.

**Step 6.2 — Manager initiates full refund**

```bash
MANAGER_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@trustcart.co.ke","password":"Test123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

# Get the order total
ORDER_TOTAL=$(curl -s \
  "http://localhost:3001/api/v1/admin/orders?status=CONFIRMED&limit=1" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  | grep -o '"total":[0-9]*' | head -1 | cut -d: -f2)

echo "Refunding: $ORDER_TOTAL KES"

curl -s -X POST \
  "http://localhost:3001/api/v1/admin/orders/$CONFIRMED_ORDER/refund" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"amount\":$ORDER_TOTAL,\"reason\":\"Customer returned damaged item — full refund\"}" \
  | python -m json.tool
```

Expected:
```json
{
  "orderId": "...",
  "orderNumber": "TC-2026-000001",
  "refundAmount": 25000,
  "newStatus": "REFUNDED",
  "message": "Refund initiated successfully (PENDING stub mode)"
}
```

**Step 6.3 — Verify Refund record in DB**

```bash
docker exec -it trustcart-postgres psql -U trustcart -d trustcart_dev \
  -c "SELECT order_id, amount, reason, status, approved_by_id, created_at FROM refunds ORDER BY created_at DESC LIMIT 3;"
```

Expected: row with `status=PENDING`, `amount` matching the refund value, `approved_by_id` set to the manager's user ID.

**Step 6.4 — Over-refund rejected**

```bash
# Use the same order ID (now REFUNDED) — remaining refundable = 0
curl -s -X POST \
  "http://localhost:3001/api/v1/admin/orders/$CONFIRMED_ORDER/refund" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":99999,"reason":"Should fail — over refund"}'
```

Expected: `{"statusCode":400,"message":"Refund amount...exceeds remaining refundable amount (0)"}`

**Step 6.5 — Browser test (Manager login)**

1. Login as `manager@trustcart.co.ke`
2. Go to `http://localhost:3000/admin/orders`
3. Find an order in CONFIRMED or DELIVERED — a red **Refund** button is visible
4. Click **Refund** → modal opens with pre-filled amount = order total, empty reason
5. Enter a reason, click **Review Refund**
6. Confirmation screen: "Refund KES X,XXX for order TC-..."
7. Click **Confirm Refund** → success toast, order status badge changes to REFUNDED

**Step 6.6 — Refund button hidden for Staff**

1. Logout, login as `staff@trustcart.co.ke`
2. Go to `http://localhost:3000/admin/orders`
3. Verify: no **Refund** button visible on any row — only **Update** buttons

---

## 7 — Sidebar Navigation Check

Open `http://localhost:3000/admin` (logged in as admin).

| Sidebar link | Destination | Expected result |
|---|---|---|
| Dashboard | `/admin` | Stats cards with real data |
| Products | `/admin/products` | Product table (pre-existing, already working) |
| Orders | `/admin/orders` | New orders management page |
| Inventory | `/admin/inventory` | New inventory management page |
| Customers | `/admin/customers` | 404 — not in Phase 8.7 scope |
| Settings | `/admin/settings` | 404 — not in Phase 8.7 scope |

---

## 8 — Security Sanity Checks

**8.1 — No token blocked on all new endpoints**

```bash
curl -s http://localhost:3001/api/v1/admin/inventory
curl -s http://localhost:3001/api/v1/admin/orders
```

Both should return `{"statusCode":401,"message":"Unauthorized"}`.

**8.2 — Customer blocked from all admin routes**

```bash
for ENDPOINT in "admin/stats" "admin/inventory" "admin/orders" "admin/products"; do
  echo -n "$ENDPOINT → "
  curl -s "http://localhost:3001/api/v1/$ENDPOINT" \
    -H "Authorization: Bearer $CUSTOMER_TOKEN" \
    | grep -o '"statusCode":[0-9]*'
done
```

All four should return `"statusCode":403`.

**8.3 — Swagger documents new endpoints**

Open `http://localhost:3001/api/docs`

Confirm these tag sections exist with all methods documented:
- **Admin Inventory** — `GET /admin/inventory`, `PATCH /admin/inventory/{productId}/adjust`
- **Admin Orders** — `GET /admin/orders`, `PATCH /admin/orders/{id}/status`, `POST /admin/orders/{id}/refund`

---

## 9 — Known Limitations

| Item | Behaviour | Reason |
|------|-----------|--------|
| Refund on POD orders | Returns `400 "No confirmed payment transaction"` | POD creates no `PaymentTransaction` record — by design |
| Dashboard trend values | Always `0` | Trend calculation deferred to Phase 8.8 |
| Customers / Settings sidebar | 404 | Not in scope for Phase 8.7 |
| Notification emails on status change | Logged to console only | Stub mode — Mailhog not required |
| Refund status | Stays `PENDING` | Actual processing deferred to Phase 9 (real MPesa) |

---

## 10 — Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `Cannot GET /api/v1/admin/inventory` | API server not running or startup error | Check `pnpm dev:api` terminal for errors |
| `401 Unauthorized` on all requests | Token expired (15 min TTL) | Re-run the login curl and update `$TOKEN` |
| Dashboard shows "Failed to load dashboard." | API shape mismatch or API not running | Check browser console → Network tab |
| Inventory page shows 404 | Next.js hasn't picked up new page file | Hard refresh (`Ctrl+Shift+R`) or restart `pnpm dev:web` |
| `prisma: command not found` | Prisma client not generated | Run `pnpm db:generate` |
| Seed fails with constraint error | DB has stale data from a previous run | Run `pnpm db:studio` → clear conflicting records, or `pnpm db:push --force-reset` (destroys all data) |
| Refund returns "No confirmed payment transaction" | Order was placed via POD | Place a new order using MPesa STK (stub) option |
