# TrustCart Kenya — Claude Code Instructions

Production-grade electronics e-commerce platform for the Kenyan market, built as an MVP with MPesa payment integration (stub mode), multi-role admin, and inventory management.

---

## 1. Project Overview

**What it is:** TrustCart Kenya is a B2C electronics e-commerce platform targeting Kenyan consumers. Key features include MPesa STK Push payments (stub in MVP), multi-zone delivery fee calculation, role-based admin operations, and inventory reservation on add-to-cart.

**Tech Stack:**

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 10 (Node 20+) |
| Frontend | Next.js 14 (App Router) |
| Database | PostgreSQL 15 + Prisma 5 ORM |
| Cache / Queues | Redis 7 + BullMQ 5 |
| Language | TypeScript 5.3 throughout |
| Package manager | pnpm 8 (workspace) |
| Auth | JWT (passport-jwt) + bcrypt |
| API Docs | Swagger/OpenAPI at `/api/docs` |
| UI Libraries | Tailwind CSS 3, Headless UI 2, Framer Motion |

**Monorepo Layout:**

```
modern-ecom/
├── apps/
│   ├── api/                    # NestJS backend (port 3001)
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules (see below)
│   │   │   ├── common/         # Guards, decorators, filters, pipes
│   │   │   ├── app.module.ts   # Root module — all imports here
│   │   │   └── main.ts         # Bootstrap, global prefix /api/v1
│   │   └── prisma/
│   │       ├── schema.prisma   # Single source of truth for DB schema
│   │       ├── migrations/     # Prisma migration files
│   │       └── seed.ts         # Seed data (test accounts, categories)
│   └── web/                    # Next.js 14 frontend (port 3000)
│       └── src/app/            # App Router root
│           ├── (admin)/admin/  # Admin layout group
│           ├── account/        # Profile + address management
│           ├── cart/           # Cart page
│           ├── checkout/       # Single-step checkout
│           ├── orders/         # Order history + detail
│           ├── products/       # Product detail
│           ├── categories/     # Category listing
│           ├── search/         # Search results
│           ├── login/          # Auth pages
│           ├── register/
│           └── page.tsx        # Home page
├── packages/
│   └── shared/                 # Shared types, constants, utils (both apps)
├── docker/
│   └── docker-compose.local.yml  # postgres, redis, mailhog
├── docs/
│   ├── architecture/           # System design docs
│   └── planning/               # Domain model, wireframes, etc.
├── CLAUDE.md                   # This file
├── State.md                    # Living implementation status tracker
└── pnpm-workspace.yaml
```

---

## 2. Architecture & Conventions

### Backend — NestJS Module Pattern

Every feature follows this structure:
```
modules/<feature>/
├── <feature>.module.ts       # Imports, controllers, providers, exports
├── <feature>.controller.ts   # HTTP routes, guards, decorators
├── <feature>.service.ts      # Business logic, Prisma calls
└── dto/                      # Request/response DTOs with class-validator
```

- Controllers own routing and request validation
- Services own all business logic and database access — never Prisma in controllers
- Modules export services if other modules need them
- Add new modules to `app.module.ts` imports

### API Route Prefix

All routes are prefixed: **`/api/v1/`** (configured in `main.ts` via `API_PREFIX` + `API_VERSION` env vars)

Example: `POST /api/v1/auth/register`, `GET /api/v1/products`

Swagger docs: `http://localhost:3001/api/docs`

### Auth Pattern

```
common/guards/
├── jwt-auth.guard.ts          # @UseGuards(JwtAuthGuard) — requires valid JWT
├── optional-jwt-auth.guard.ts # Cart/checkout — works with or without JWT
└── roles.guard.ts             # @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(...)

common/decorators/
├── roles.decorator.ts         # @Roles(UserRole.ADMIN, UserRole.MANAGER)
└── current-user.decorator.ts  # @CurrentUser() — injects user from JWT payload
```

Role hierarchy (lowest → highest): `CUSTOMER < STAFF < MANAGER < ADMIN`

Admin endpoints require both guards:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
```

### Async Processing — BullMQ

Queue name: **`notifications`** (registered in `NotificationsModule`)

Job names handled by `NotificationProcessor`:
- `order.status_changed` — customer notification on order status change
- `order.confirmed` — post-payment confirmation notification

To enqueue: inject the queue via `@InjectQueue('notifications')` and call `queue.add(jobName, payload)`.

### Frontend — Next.js App Router Conventions

- `page.tsx` — route entry point (server component by default)
- `layout.tsx` — shared layout wrapper
- `'use client'` — required for any component with state/effects/event handlers
- Client-side API calls live in `apps/web/src/lib/api.ts`
- Auth token stored in `localStorage` (`authToken` key), read in `api.ts` for Bearer header
- Admin pages live under `apps/web/src/app/(admin)/admin/` route group

---

## 3. Database

**Schema location:** `apps/api/prisma/schema.prisma`

**Key models and relationships:**

| Model | Key Relations |
|-------|--------------|
| `User` | has many `Address`, `Cart`, `Order` |
| `Product` | belongs to `Category`, `Brand`; has one `InventoryRecord`; many `ProductImage`, `ProductAttribute` |
| `InventoryRecord` | `quantityOnHand`, `quantityReserved`, `reorderThreshold` (default 5) |
| `StockAdjustment` | audit log for every inventory change |
| `Cart` | belongs to `User` (nullable for guest); has many `CartItem`, `Reservation` |
| `Order` | has many `OrderItem`, one `OrderAddress`, many `OrderStatusHistory` |
| `PaymentTransaction` | belongs to `Order`; has one `MpesaTransaction` |
| `Refund` | belongs to `Order` + `PaymentTransaction` |
| `PromoCode` | many-to-many `PromoUsage` |

**Running migrations:**
```bash
pnpm db:migrate          # Run pending migrations (from repo root)
pnpm db:generate         # Regenerate Prisma client after schema changes
pnpm db:push             # Push schema without migration (dev only)
pnpm db:studio           # Open Prisma Studio at localhost:5555
```

**Seed data:**
```bash
pnpm db:seed             # Run prisma/seed.ts
```

Seed creates: admin user, staff/manager/customer test accounts, product categories, brands, sample products.

**Test credentials (all same password):**
- `admin@trustcart.co.ke` / `Test123!` — ADMIN role
- Other seeded users share the same `Test123!` password

---

## 4. Development Commands

All commands run from the **repo root** unless noted.

**Start everything:**
```bash
pnpm docker:up           # Start postgres + redis (mailhog needs --profile email)
pnpm dev                 # Start API (port 3001) + web (port 3000) in parallel
```

**Individual services:**
```bash
pnpm dev:api             # NestJS API only
pnpm dev:web             # Next.js frontend only
```

**Tests:**
```bash
pnpm test                # All tests (unit + integration)
pnpm test:cov            # Coverage report (80% threshold enforced)
pnpm --filter api test:e2e   # E2E tests (requires running postgres)
```

**Quality checks:**
```bash
pnpm type-check          # tsc --noEmit across all packages
pnpm lint                # ESLint across all packages
pnpm format:check        # Prettier check
pnpm format              # Prettier write (auto-fix)
```

**Build:**
```bash
pnpm build               # Build all packages
pnpm build:api           # API only
pnpm build:web           # Frontend only
```

**Docker:**
```bash
pnpm docker:up           # Start services (detached)
pnpm docker:down         # Stop services
pnpm docker:logs         # Follow logs
```

---

## 5. Environment Setup

**Env file locations:**
- Backend: `apps/api/.env.local` (copy from `apps/api/.env.example`)
- Frontend: `apps/web/.env.local` (copy from `apps/web/.env.example`)

**Key backend env vars (`apps/api/.env.local`):**

| Variable | Value (local) | Notes |
|----------|--------------|-------|
| `DATABASE_URL` | `postgresql://trustcart:trustcart_local@localhost:5432/trustcart_dev` | Docker postgres |
| `REDIS_HOST` | `localhost` | Docker redis |
| `REDIS_PORT` | `6379` | |
| `JWT_SECRET` | `<long random string>` | Never commit real value |
| `JWT_ACCESS_EXPIRY` | `15m` | |
| `NODE_ENV` | `development` | |
| `PORT` | `3001` | |
| `EMAIL_ENABLED` | `false` | Mailhog for local |
| `EMAIL_HOST` | `localhost` | |
| `EMAIL_PORT` | `1025` | |

**Key frontend env vars (`apps/web/.env.local`):**

| Variable | Value (local) |
|----------|--------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_ENABLE_POD` | `true` |

**Docker services (local):**

| Service | Container | Ports |
|---------|-----------|-------|
| PostgreSQL 15 | `trustcart-postgres` | `5432` |
| Redis 7 | `trustcart-redis` | `6379` |
| Mailhog | `trustcart-mailhog` | SMTP `1025`, UI `8025` |

Start Mailhog: `docker-compose -f docker/docker-compose.local.yml --profile email up -d`

---

## 6. Implementation Plan Reference

| Document | Location | Purpose |
|----------|----------|---------|
| Phase 8 Audit Report | `docs/phase-8-audit-report.md` | Detailed gap analysis per step (8.1–8.7) |
| Project State | `State.md` (repo root) | Living status tracker — update after each session |
| MVP Implementation Plan | `docs/architecture/mvp-implementation-plan.md` | Phase definitions, exit criteria |
| Domain Model | `docs/planning/domain-model.md` | Entity relationships |
| API Contracts | `docs/architecture/database-api-contracts-plan.md` | Endpoint specs |
| Order Lifecycle | `docs/planning/order-lifecycle-state-machine.md` | Valid status transitions |
| Agent Scope | `docs/planning/agent-scope-authority.md` | What requires human approval |

**Risk classification for implementation decisions:**

| Level | Colour | Examples | Agent Authority |
|-------|--------|---------|----------------|
| Low | 🟢 | Product catalog, search, cart UI | Autonomous |
| Medium | 🟡 | User registration, order creation | Autonomous with logging |
| High | 🔴 | Payment logic, refunds, order cancellation | **Requires approval** |

---

## 7. Code Quality Rules

**Before marking any task done:**
1. Run `pnpm type-check` — zero TypeScript errors
2. Run `pnpm lint` — zero lint errors
3. Manually verify the route or page works end-to-end

**Every new backend endpoint needs:**
- DTO in `dto/` with `class-validator` decorators (`@IsString()`, `@IsInt()`, etc.)
- Controller method with correct HTTP decorator + Swagger `@ApiOperation`
- Service method with real Prisma logic (no empty bodies, no hardcoded stubs)
- Unit test (`.spec.ts`) covering happy path and key error cases

**Every new frontend page needs:**
- `page.tsx` at the correct App Router path
- Auth gating: redirect unauthenticated users where appropriate
- Loading and error states

**Admin endpoints must:**
- Have `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` on the controller class
- Log the action to an audit trail (StockAdjustment for inventory, OrderStatusHistory for orders)
- Check role minimums: STAFF+ for status updates, MANAGER+ for refunds and product creation

**Inventory / payment / refund operations must:**
- Create audit records (`StockAdjustment`, `OrderStatusHistory`, `Refund`) on every write
- Run inside a Prisma `$transaction` if multiple tables are modified

**Never use `any` type** — define an interface or use the Prisma-generated types.

---

## 8. Current Constraints

| Constraint | Detail |
|-----------|--------|
| Environments | Local and Dev only — no production deployment |
| Payments | Stub mode — no real MPesa API calls. Stub auto-confirms via `setTimeout` |
| Email | Stub mode — logs to console; Mailhog captures in local env |
| SMS | Disabled in MVP — `SMS_ENABLED=false` |
| Real MPesa | Requires separate human approval before implementation |
| Refunds | Backend not yet implemented — requires Manager+ and audit log |
