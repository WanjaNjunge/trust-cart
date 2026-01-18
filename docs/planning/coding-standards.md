# Coding Standards & Conventions

**Document Status:** Draft — Pending Human Sign-off  
**Last Updated:** 2026-01-18  
**Version:** 1.0

---

## Overview

This document defines the coding standards and conventions for the TrustCart Kenya e-commerce platform. It establishes:

- Technology stack and versioning
- Architecture and design patterns
- Folder and module structure
- Naming conventions
- Testing requirements
- Logging and error handling

All code contributions must adhere to these standards.

---

## 1. Technology Stack

### 1.1 Confirmed Stack

| Layer | Technology | Version (Minimum) |
|-------|------------|-------------------|
| **Frontend Framework** | Next.js (App Router) | 14.x |
| **Frontend Language** | TypeScript | 5.x |
| **Frontend Styling** | Tailwind CSS | 3.x |
| **Backend Framework** | NestJS | 10.x |
| **Backend Language** | TypeScript | 5.x |
| **Database** | PostgreSQL | 15.x |
| **ORM** | Prisma | 5.x |
| **Queue** | BullMQ | 4.x |
| **Cache/Queue Backend** | Redis | 7.x |
| **Runtime** | Node.js | 20.x LTS |
| **Package Manager** | pnpm | 8.x |

### 1.2 TypeScript Requirements

| Rule | Description |
|------|-------------|
| **Strict Mode** | `strict: true` in tsconfig |
| **No Any** | Avoid `any`; use `unknown` if type is uncertain |
| **Explicit Types** | All function parameters and return types must be typed |
| **Interfaces Over Types** | Use interfaces for object shapes; types for unions/primitives |
| **No Implicit Returns** | All functions must have explicit return statements |

### 1.3 Frontend Patterns (Next.js)

| Pattern | Description |
|---------|-------------|
| **Server Components** | Default for all components; use Client only when needed |
| **Client Components** | Mark with `'use client'` only for interactivity |
| **Data Fetching** | Server-side in Server Components; React Query for client |
| **Forms** | React Hook Form with Zod validation |
| **State Management** | Local state preferred; Context for shared; avoid global stores |
| **Styling** | Tailwind utility classes; no inline styles |
| **Components** | Functional components only; no class components |

### 1.4 Backend Patterns (NestJS)

| Pattern | Description |
|---------|-------------|
| **Layered Architecture** | Controller → Service → Repository |
| **Dependency Injection** | Use NestJS DI; inject via constructor |
| **DTOs** | Data Transfer Objects for all request/response |
| **Validation** | class-validator decorators on DTOs |
| **Exception Handling** | Use built-in HttpException classes |
| **Domain Logic** | In services only; never in controllers |
| **Database Access** | Via repositories only; never direct Prisma in services |

### 1.5 Architectural Layers

```
┌─────────────────────────────────────────────────────────┐
│                      Controller                         │
│         (HTTP handling, input validation, routing)      │
├─────────────────────────────────────────────────────────┤
│                       Service                           │
│           (Business logic, orchestration)               │
├─────────────────────────────────────────────────────────┤
│                      Repository                         │
│              (Data access, Prisma calls)                │
├─────────────────────────────────────────────────────────┤
│                       Database                          │
│                     (PostgreSQL)                        │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Folder & Module Structure

### 2.1 Monorepo Structure

```
trustcart/
├── apps/
│   ├── web/                    # Next.js frontend
│   └── api/                    # NestJS backend
├── packages/
│   ├── shared/                 # Shared types, utilities
│   ├── ui/                     # Shared UI components
│   └── config/                 # Shared configuration
├── docs/                       # Documentation
│   └── planning/               # Planning artefacts
├── prisma/                     # Database schema and migrations
├── scripts/                    # Build and utility scripts
├── .github/                    # CI/CD workflows
└── package.json                # Root package.json
```

### 2.2 Frontend Structure (apps/web)

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/           # Public routes (no auth)
│   │   │   ├── page.tsx        # Home page
│   │   │   ├── products/       # Product pages
│   │   │   ├── cart/           # Cart page
│   │   │   └── checkout/       # Checkout flow
│   │   ├── (auth)/             # Auth routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (account)/          # Authenticated customer routes
│   │   │   ├── profile/
│   │   │   └── orders/
│   │   ├── admin/              # Admin routes
│   │   │   ├── dashboard/
│   │   │   ├── orders/
│   │   │   └── products/
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components
│   │   ├── forms/              # Form components
│   │   ├── product/            # Product-related components
│   │   ├── cart/               # Cart components
│   │   └── layout/             # Layout components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   ├── services/               # API client services
│   ├── types/                  # TypeScript types
│   └── constants/              # Constants and enums
├── public/                     # Static assets
└── tests/                      # Test files
```

### 2.3 Backend Structure (apps/api)

```
apps/api/
├── src/
│   ├── modules/                # Feature modules (domain-based)
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── dto/
│   │   │   ├── guards/
│   │   │   └── strategies/
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.module.ts
│   │   │   ├── dto/
│   │   │   └── entities/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── inventory/
│   │   ├── delivery/
│   │   └── promotions/
│   ├── common/                 # Shared utilities
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── utils/
│   ├── config/                 # Configuration
│   ├── database/               # Database module
│   ├── queue/                  # BullMQ workers
│   ├── webhooks/               # External webhooks
│   ├── app.module.ts           # Root module
│   └── main.ts                 # Entry point
└── test/                       # Test files
    ├── unit/
    ├── integration/
    └── e2e/
```

### 2.4 Module Organization Rules

| Rule | Description |
|------|-------------|
| **Domain-Based** | Organize by business domain, not technical layer |
| **Co-location** | Keep related files together in module folders |
| **Single Responsibility** | Each module owns one domain |
| **Explicit Dependencies** | Import only what's needed; avoid circular deps |
| **Index Exports** | Use index.ts for public module exports |

---

## 3. Naming Conventions

### 3.1 General Rules

| Element | Convention | Example |
|---------|------------|---------|
| **Files (Components)** | PascalCase | `ProductCard.tsx` |
| **Files (Utilities)** | kebab-case | `format-currency.ts` |
| **Files (Backend)** | kebab-case with suffix | `users.service.ts` |
| **Directories** | kebab-case | `product-details/` |
| **Classes** | PascalCase | `ProductService` |
| **Interfaces** | PascalCase with I prefix (optional) | `Product` or `IProduct` |
| **Types** | PascalCase | `OrderStatus` |
| **Functions** | camelCase | `calculateTotal()` |
| **Variables** | camelCase | `orderItems` |
| **Constants** | SCREAMING_SNAKE_CASE | `MAX_CART_ITEMS` |
| **Enums** | PascalCase values | `OrderStatus.CONFIRMED` |

### 3.2 Frontend-Specific

| Element | Convention | Example |
|---------|------------|---------|
| **Components** | PascalCase | `ProductCard` |
| **Component Files** | PascalCase.tsx | `ProductCard.tsx` |
| **Hooks** | camelCase with use prefix | `useCart` |
| **Hook Files** | camelCase.ts | `useCart.ts` |
| **Context** | PascalCase with Context suffix | `CartContext` |
| **Props** | PascalCase with Props suffix | `ProductCardProps` |
| **CSS Classes** | Tailwind utilities | — |
| **Data Attributes** | kebab-case | `data-testid="product-card"` |

### 3.3 Backend-Specific

| Element | Convention | Example |
|---------|------------|---------|
| **Controllers** | PascalCase with Controller suffix | `OrdersController` |
| **Services** | PascalCase with Service suffix | `OrdersService` |
| **Repositories** | PascalCase with Repository suffix | `OrdersRepository` |
| **Modules** | PascalCase with Module suffix | `OrdersModule` |
| **DTOs** | PascalCase with Dto suffix | `CreateOrderDto` |
| **Guards** | PascalCase with Guard suffix | `JwtAuthGuard` |
| **Decorators** | PascalCase | `CurrentUser` |
| **Pipes** | PascalCase with Pipe suffix | `ValidationPipe` |

### 3.4 Database & API

| Element | Convention | Example |
|---------|------------|---------|
| **Tables (Prisma)** | PascalCase singular | `Order`, `Product` |
| **Columns** | camelCase | `createdAt`, `orderId` |
| **API Endpoints** | kebab-case, plural | `/api/v1/orders` |
| **Query Params** | camelCase | `?pageSize=20` |
| **Request Body** | camelCase | `{ "orderId": "..." }` |
| **Response Body** | camelCase | `{ "data": { ... } }` |

### 3.5 Prefixes and Suffixes

| Suffix | Use For | Example |
|--------|---------|---------|
| `Dto` | Data Transfer Objects | `CreateOrderDto` |
| `Entity` | Database entities | `OrderEntity` |
| `Service` | Business logic | `PaymentService` |
| `Repository` | Data access | `OrderRepository` |
| `Controller` | HTTP handlers | `OrdersController` |
| `Guard` | Auth guards | `RolesGuard` |
| `Middleware` | HTTP middleware | `LoggingMiddleware` |
| `Worker` | Queue workers | `PaymentVerificationWorker` |
| `Processor` | Queue processors | `OrderProcessor` |

---

## 4. Testing Requirements

### 4.1 Testing Strategy

| Test Type | Purpose | Coverage Target |
|-----------|---------|-----------------|
| **Unit Tests** | Test individual functions/classes in isolation | 80% line coverage |
| **Integration Tests** | Test module interactions, API endpoints | All endpoints |
| **E2E Tests** | Test complete user flows | Critical paths only |

### 4.2 Test File Organization

| Location | Test Type | Naming |
|----------|-----------|--------|
| `*.spec.ts` (co-located) | Unit tests | `users.service.spec.ts` |
| `test/integration/` | Integration tests | `orders.integration.spec.ts` |
| `test/e2e/` | E2E tests | `checkout.e2e.spec.ts` |
| `tests/` (frontend) | Frontend tests | `ProductCard.test.tsx` |

### 4.3 Mandatory Test Coverage

> [!IMPORTANT]
> The following must have 100% test coverage:

| Domain | Required Tests |
|--------|----------------|
| **Payment flows** | STK push initiation, callback handling, timeout, failure, refund |
| **Order lifecycle** | All state transitions, validation of forbidden transitions |
| **Inventory** | Reservation, decrement, release, negative stock prevention |
| **Authentication** | Login, logout, token refresh, password reset |
| **Authorization** | Role-based access for all protected endpoints |
| **Cart operations** | Add, remove, update quantity, promo code |
| **Checkout validation** | Address validation, stock check, price verification |

### 4.4 Testing Framework

| Layer | Framework | Runner |
|-------|-----------|--------|
| **Backend Unit** | Jest | `pnpm test` |
| **Backend Integration** | Jest + Supertest | `pnpm test:integration` |
| **Backend E2E** | Jest + Supertest | `pnpm test:e2e` |
| **Frontend Unit** | Jest + React Testing Library | `pnpm test` |
| **Frontend E2E** | Playwright | `pnpm test:e2e` |

### 4.5 Test Naming Convention

```typescript
describe('OrdersService', () => {
  describe('createOrder', () => {
    it('should create order when cart is valid', async () => { ... });
    it('should throw error when cart is empty', async () => { ... });
    it('should reserve inventory on order creation', async () => { ... });
  });
});
```

| Pattern | Purpose |
|---------|---------|
| `describe(ClassName)` | Group by class/module |
| `describe(methodName)` | Group by method |
| `it('should...')` | Describe expected behavior |

### 4.6 Test Data Management

| Rule | Description |
|------|-------------|
| **Factories** | Use factory functions to create test data |
| **Fixtures** | Use fixtures for static test data |
| **Database Reset** | Reset database between integration tests |
| **No Production Data** | Never use real customer data in tests |
| **Deterministic** | Tests must produce consistent results |

---

## 5. Logging & Error Handling

### 5.1 Logging Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| **error** | Unrecoverable errors, exceptions | Payment callback failed |
| **warn** | Recoverable issues, unusual behavior | Stock running low |
| **info** | Significant business events | Order created, payment confirmed |
| **debug** | Detailed debugging information | Request/response details |
| **trace** | Very detailed execution flow | Function entry/exit |

### 5.2 Logging Standards

| Rule | Description |
|------|-------------|
| **Structured Logging** | Use JSON format for all logs |
| **Correlation ID** | Include request ID in all logs |
| **Context** | Include relevant context (userId, orderId, etc.) |
| **No PII** | Never log passwords, full phone numbers, or card data |
| **Mask Sensitive Data** | Mask emails, partial phone numbers |
| **Timestamp** | ISO 8601 format in UTC |

### 5.3 Log Format

```json
{
  "timestamp": "2026-01-18T10:30:00.000Z",
  "level": "info",
  "message": "Order created successfully",
  "requestId": "req_abc123",
  "userId": "cust_xyz789",
  "orderId": "ord_def456",
  "context": "OrdersService",
  "data": {
    "itemCount": 3,
    "total": 49290
  }
}
```

### 5.4 Error Handling Patterns

#### Backend Error Handling

| Layer | Responsibility |
|-------|----------------|
| **Controller** | Catch and transform to HTTP response |
| **Service** | Throw domain-specific exceptions |
| **Repository** | Throw data access exceptions |
| **Global Filter** | Catch unhandled exceptions; format response |

#### Error Classes

| Exception | HTTP Status | Use Case |
|-----------|-------------|----------|
| `BadRequestException` | 400 | Invalid input |
| `UnauthorizedException` | 401 | Not authenticated |
| `ForbiddenException` | 403 | Not authorized |
| `NotFoundException` | 404 | Resource not found |
| `ConflictException` | 409 | State conflict |
| `UnprocessableEntityException` | 422 | Validation failed |
| `InternalServerErrorException` | 500 | Unexpected error |

### 5.5 Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ],
    "requestId": "req_abc123"
  }
}
```

### 5.6 Retry & Fallback Patterns

| Scenario | Strategy |
|----------|----------|
| **External API timeout** | Retry 3 times with exponential backoff |
| **MPesa callback delay** | Queue for async verification |
| **Database connection** | Retry with circuit breaker |
| **Email sending** | Queue with retry; log failure |
| **Redis unavailable** | Fallback to database; alert |

### 5.7 Alert Triggers

| Condition | Alert Level | Response |
|-----------|-------------|----------|
| **Error rate > 1%** | Warning | Investigate |
| **Error rate > 5%** | Critical | Immediate action |
| **Payment success < 95%** | Critical | Escalate |
| **Response time p95 > 2s** | Warning | Investigate |
| **Queue backlog > 1000** | Warning | Scale workers |

---

## 6. Code Quality Rules

### 6.1 Linting & Formatting

| Tool | Purpose | Config |
|------|---------|--------|
| **ESLint** | Code quality | `eslint.config.js` |
| **Prettier** | Code formatting | `.prettierrc` |
| **TypeScript** | Type checking | `tsconfig.json` |

### 6.2 Pre-Commit Hooks

| Hook | Check |
|------|-------|
| **lint-staged** | Run ESLint on staged files |
| **prettier** | Format staged files |
| **tsc** | Type check |
| **test** | Run affected tests |

### 6.3 Code Review Requirements

| Requirement | Description |
|-------------|-------------|
| **Minimum Reviewers** | 1 developer for features; 2 for high-risk changes |
| **CI Must Pass** | All checks (lint, test, build) must pass |
| **No Direct Push** | All changes via pull request |
| **Linked Issue** | PR must reference issue or ticket |
| **Description** | PR must explain what and why |

### 6.4 Documentation Requirements

| Code Element | Documentation |
|--------------|---------------|
| **Public Functions** | JSDoc with params, return, throws |
| **Classes** | JSDoc with purpose |
| **Complex Logic** | Inline comments explaining why |
| **APIs** | OpenAPI/Swagger annotations |
| **Config** | Comments for non-obvious settings |

### 6.5 Forbidden Patterns

| Pattern | Why Forbidden | Alternative |
|---------|---------------|-------------|
| `any` type | Loses type safety | Use `unknown` or proper type |
| `// @ts-ignore` | Hides type errors | Fix the type issue |
| `console.log` | Not structured | Use logger service |
| `var` keyword | Scoping issues | Use `const` or `let` |
| Magic numbers | Poor readability | Use named constants |
| Nested callbacks | Hard to read | Use async/await |
| God classes | Too many responsibilities | Split into smaller classes |
| Direct DB in controller | Bypasses service layer | Use service |

---

## 7. Security Coding Standards

### 7.1 Input Validation

| Rule | Description |
|------|-------------|
| **Validate All Input** | Never trust user input |
| **Use DTOs** | Define shape of all request bodies |
| **Use Pipes** | NestJS validation pipes on all endpoints |
| **Sanitize HTML** | Escape user content before rendering |
| **Limit Lengths** | Set max lengths on string inputs |

### 7.2 Authentication & Authorization

| Rule | Description |
|------|-------------|
| **JWT Validation** | Always verify JWT signature and expiration |
| **Role Checks** | Use guards for role-based access |
| **Resource Ownership** | Verify user owns resource they're accessing |
| **Rate Limiting** | Apply rate limits to auth endpoints |
| **Secure Cookies** | HttpOnly, Secure, SameSite flags |

### 7.3 Data Protection

| Rule | Description |
|------|-------------|
| **No Secrets in Code** | Use environment variables |
| **Encrypt Sensitive Data** | Encrypt PII at rest |
| **HTTPS Only** | All traffic over TLS |
| **No PII in URLs** | Use request body for sensitive data |
| **Mask in Logs** | Never log plaintext PII |

---

## Document Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Tech Lead | — | Pending | — |
| Backend Lead | — | Pending | — |
| Frontend Lead | — | Pending | — |

---

*This document defines coding standards. All code contributions must adhere to these rules. Deviations require documented justification and tech lead approval.*
