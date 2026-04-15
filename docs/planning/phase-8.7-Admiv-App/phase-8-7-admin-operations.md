# Phase 8.7: Admin Operations - Implementation Plan

**Objective:** Implement a secure, role-based administration panel for managing products, orders, and inventory.

## 1. Overview & Architecture

The Admin Panel will be a dedicated section of the frontend app (e.g., `/admin/*`), protected by strict Role-Based Access Control (RBAC). It will utilize the existing `UserRole` enum (`ADMIN`, `MANAGER`, `STAFF`) to gate access.

### Role Permissions
| Feature | STAFF | MANAGER | ADMIN |
| :--- | :---: | :---: | :---: |
| **View Dashboard** | ✅ | ✅ | ✅ |
| **View Orders** | ✅ | ✅ | ✅ |
| **Update Order Status** | ✅ | ✅ | ✅ |
| **Refund Orders** | ❌ | ✅ | ✅ |
| **View Products** | ✅ | ✅ | ✅ |
| **Manage Products** | ❌ | ✅ | ✅ |
| **View Inventory** | ✅ | ✅ | ✅ |
| **Adjust Stock** | ❌ | ✅ | ✅ |
| **Manage Users** | ❌ | ❌ | ✅ |

---

## 2. Sub-Phases Breakdown

### Phase 8.7.1: Foundation & Security 🛡️
**Goal:** Establish the secure shell for the admin area.
- **Backend:**
    - Initialize `AdminModule`.
    - Create `AdminController` with `UseGuards(OptionalJwtAuthGuard, RolesGuard)`.
    - Implement `GET /admin/stats` (simple stub for now).
- **Frontend:**
    - Create `/admin` layout with dedicated Sidebar Navigation.
    - Implement `AdminRouteGuard` (client-side redirect if not authorized).
    - Create `AdminDashboard` skeleton page.
    - **Deliverable:** Secure `/admin` route accessible only to Staff+.

### Phase 8.7.2: Product Management 📦
**Goal:** Enable full catalog management (CRUD).
- **Backend:**
    - `POST /admin/products` (Create)
    - `PATCH /admin/products/:id` (Update details, price, status)
    - `DELETE /admin/products/:id` (Soft delete/Deactivate)
- **Frontend:**
    - **Product List:** Data table with search, filter, and pagination.
    - **Product Form:** Multi-step or long form for:
        - Basic Info (Name, SKU, Slug via auto-gen)
        - Pricing & Inventory (Price, CompareAt, Stock)
        - Categorization (Category, Brand)
        - Attributes (Dynamic key-value pairs)
    - **Image Management:** Upload, Reorder, Set Primary.
    - **Deliverable:** Admins/Managers can add and edit products.

### Phase 8.7.3: Order Management 🚚
**Goal:** Process customer orders efficiently.
- **Backend:**
    - `GET /admin/orders` (List with advanced filters: date, status, payment).
    - `GET /admin/orders/:id` (Full admin view).
    - `PATCH /admin/orders/:id/status` (Transition state machine).
- **Frontend:**
    - **Order List:** Sortable table with status badges.
    - **Order Detail:**
        - Customer info, Shipping address map link.
        - Order timeline (history).
        - Action buttons: "Mark as Processing", "Dispatch", "Complete".
    - **Refund UI:** Modal for Managers+ to initiate refunds.
    - **Deliverable:** Staff can view and process orders through lifecycle.

### Phase 8.7.4: Inventory Management 📊
**Goal:** Track stock and handle adjustments.
- **Backend:**
    - `GET /admin/inventory` (Low stock priority).
    - `POST /admin/inventory/adjust` (Log stock adjustment with reason).
- **Frontend:**
    - **Inventory Table:** Show Stock on Hand vs. Reserved.
    - **Adjustment Modal:** Select Reason (Damage, Restock, Correction) and Qty.
    - **Low Stock Alerts:** Visual indicators for items below threshold.
    - **Deliverable:** Real-time stock visibility and correction tools.

### Phase 8.7.5: Dashboard & Polish 📈
**Goal:** Provide high-level insights.
- **Backend:**
    - Enhanced `GET /admin/stats` to return real metrics:
        - Total Revenue (Day/Month).
        - Orders Count (Day/Month).
        - Low Stock Count.
- **Frontend:**
    - **Overview Widgets:** Key metric cards.
    - **Recent Orders:** Quick list of last 5 orders.
    - **Performance:** Ensure tables scale with data.
    - **Deliverable:** Professional dashboard for business overview.

---

## 3. Implementation Checklist Summary

### Backend (`apps/api`)
- [ ] `AdminModule` setup
- [ ] `AdminProductsController` & Service
- [ ] `AdminOrdersController` & Service
- [ ] `AdminInventoryController` & Service
- [ ] `StockAdjustment` logging logic

### Frontend (`apps/web`)
- [ ] Admin Layout (`/app/admin/layout.tsx`)
- [ ] Products Page (`/app/admin/products/page.tsx`)
- [ ] Product Edit/Create (`/app/admin/products/[id]/page.tsx`)
- [ ] Orders Page (`/app/admin/orders/page.tsx`)
- [ ] Order Detail (`/app/admin/orders/[id]/page.tsx`)
- [ ] Inventory Page (`/app/admin/inventory/page.tsx`)
