# TrustCart Kenya

A production-grade B2C electronics e-commerce platform built for the Kenyan market. Features MPesa STK Push payments, real-time inventory management, role-based administration, and async order processing — all in a TypeScript monorepo.

---

## Features

- **MPesa Integration** — STK Push payment flow with idempotency checks and status polling
- **Inventory Reservation** — Stock reserved on add-to-cart, released on expiry or cancellation
- **Multi-Zone Delivery** — Delivery fee calculation based on Kenyan delivery zones
- **Role-Based Admin** — Four-tier access control: `CUSTOMER → STAFF → MANAGER → ADMIN`
- **Async Notifications** — BullMQ-powered job queue for order status and payment events
- **Full Order Lifecycle** — Enforced state machine from placement through fulfillment and refunds
- **Audit Logging** — Every inventory change and order status transition is recorded

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| Backend | NestJS 10, TypeScript, Passport JWT |
| Database | PostgreSQL 15, Prisma ORM |
| Cache / Queues | Redis 7, BullMQ |
| Runtime | Node.js 20 LTS |
| Package Manager | pnpm 8 (workspace monorepo) |
| API Docs | Swagger / OpenAPI |

---

## Project Structure

```
modern-ecom/
├── apps/
│   ├── api/          # NestJS backend — port 3001
│   └── web/          # Next.js frontend — port 3000
├── packages/
│   └── shared/       # Shared types, constants, utilities
├── docs/             # Architecture and planning docs
└── docker/           # Local service definitions
```

---

## Prerequisites

- Node.js 20+
- pnpm 8+ (`npm i -g pnpm`)
- Docker

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL and Redis
pnpm docker:up

# 3. Configure environment
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local

# 4. Set up the database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 5. Start development servers
pnpm dev
```

---

## Environment Variables

**Backend** (`apps/api/.env.local`):

| Variable | Local Value |
|---|---|
| `DATABASE_URL` | `postgresql://trustcart:trustcart_local@localhost:5432/trustcart_dev` |
| `REDIS_HOST` | `localhost` |
| `REDIS_PORT` | `6379` |
| `JWT_SECRET` | *(long random string)* |
| `NODE_ENV` | `development` |
| `PORT` | `3001` |

**Frontend** (`apps/web/.env.local`):

| Variable | Local Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |

---

## Development URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/api/docs |
| Prisma Studio | http://localhost:5555 |
| Mailhog UI | http://localhost:8025 |

**Seed test accounts** (password: `Test123!`):

| Email | Role |
|---|---|
| admin@trustcart.co.ke | ADMIN |

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps |
| `pnpm dev:api` | Backend only |
| `pnpm dev:web` | Frontend only |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm test:cov` | Coverage report (80% threshold) |
| `pnpm lint` | Lint all packages |
| `pnpm type-check` | TypeScript check across all packages |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm docker:up` | Start local services |
| `pnpm docker:down` | Stop local services |

---

## Architecture

The backend follows a strict NestJS module pattern — each feature owns its controller, service, and DTOs. All business logic lives in services; controllers handle routing and validation only. Database writes that span multiple tables run inside Prisma transactions. Every payment and inventory operation produces an audit record.

Auth uses JWT with role guards applied at the controller level. The frontend stores tokens in `localStorage` and attaches them via `Authorization: Bearer` on every API call.

Async work (notifications, payment confirmation) is offloaded to a BullMQ `notifications` queue backed by Redis, keeping HTTP response times fast.

---

## License

Proprietary — All rights reserved
