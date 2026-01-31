# Project Initialization Plan

**Document Status:** Implementation Plan — Pending Approval  
**Last Updated:** 2026-01-18  
**Version:** 1.0  
**Scope:** Local and Dev Environments Only

---

## Overview

This document provides a step-by-step plan for initializing the TrustCart Kenya e-commerce project. It focuses exclusively on **Local and Dev environments** and establishes the foundational scaffolding before any business logic implementation.

> [!IMPORTANT]
> **Scope Boundaries:**
>
> - ✅ Project scaffolding, folder structure, configs
> - ✅ Local and Dev environment setup
> - ✅ CI/CD skeleton for Local and Dev
> - ❌ No business logic implementation
> - ❌ No high-risk domains (payments, refunds, PII)
> - ❌ No SIT, UAT, or Production deployment

---

## 1. Repository & Branch Structure

### 1.1 Repository Strategy

**Decision:** Monorepo structure using pnpm workspaces.

```
modern-ecom/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # NestJS backend
├── packages/
│   └── shared/           # Shared TypeScript types and utilities
├── docs/                 # Documentation (already exists)
├── scripts/              # Build and deployment scripts
├── .github/              # GitHub Actions workflows
├── docker/               # Docker configurations
└── infrastructure/       # IaC templates (future)
```

### 1.2 Branch Structure

| Branch      | Purpose               | Protection                   |
| ----------- | --------------------- | ---------------------------- |
| `main`      | Production-ready code | Protected, requires approval |
| `develop`   | Integration branch    | Protected, requires 1 review |
| `feature/*` | Feature development   | No protection                |
| `bugfix/*`  | Bug fixes             | No protection                |
| `release/*` | Release preparation   | Protected                    |
| `hotfix/*`  | Production hotfixes   | Protected                    |

### 1.3 Branch Naming Convention

```
feature/TC-{ticket}-{short-description}
bugfix/TC-{ticket}-{short-description}
release/v{major}.{minor}.{patch}
hotfix/v{major}.{minor}.{patch}-{fix}
```

---

## 2. Project Folder Structure

### 2.1 Backend Structure (apps/api)

```
apps/api/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── common/                    # Shared utilities
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── utils/
│   ├── config/                    # Configuration module
│   │   ├── config.module.ts
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── app.config.ts
│   ├── database/                  # Prisma and migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── database.module.ts
│   ├── modules/                   # Domain modules
│   │   ├── user/
│   │   │   ├── user.module.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   └── __tests__/
│   │   │       ├── user.service.spec.ts
│   │   │       └── user.controller.spec.ts
│   │   ├── product/
│   │   ├── inventory/
│   │   ├── cart/
│   │   ├── order/
│   │   ├── payment/
│   │   ├── delivery/
│   │   ├── promotion/
│   │   ├── review/
│   │   └── auth/
│   ├── queues/                    # BullMQ job processors
│   │   ├── queues.module.ts
│   │   ├── processors/
│   │   └── jobs/
│   └── webhooks/                  # External webhook handlers
│       ├── webhooks.module.ts
│       ├── mpesa/
│       └── courier/
├── test/                          # E2E tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── .env.example                   # Environment template
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

### 2.2 Frontend Structure (apps/web)

```
apps/web/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Home page
│   │   ├── globals.css            # Global styles
│   │   ├── (public)/              # Public routes
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   ├── categories/
│   │   │   └── cart/
│   │   ├── (auth)/                # Auth routes
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (account)/             # Protected customer routes
│   │   │   ├── layout.tsx
│   │   │   ├── orders/
│   │   │   ├── profile/
│   │   │   └── addresses/
│   │   ├── checkout/              # Checkout flow
│   │   └── admin/                 # Admin routes
│   │       ├── layout.tsx
│   │       ├── dashboard/
│   │       ├── products/
│   │       ├── orders/
│   │       └── inventory/
│   ├── components/                # Reusable components
│   │   ├── ui/                    # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── modal.tsx
│   │   ├── layout/                # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── sidebar.tsx
│   │   ├── product/               # Product components
│   │   ├── cart/                  # Cart components
│   │   └── order/                 # Order components
│   ├── lib/                       # Utilities and helpers
│   │   ├── api.ts                 # API client
│   │   ├── utils.ts               # Utility functions
│   │   └── format.ts              # Formatters (currency, date)
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-cart.ts
│   │   └── use-auth.ts
│   ├── types/                     # TypeScript types
│   │   └── index.ts
│   └── styles/                    # Additional styles
├── public/                        # Static assets
│   ├── images/
│   └── icons/
├── __tests__/                     # Test files
│   ├── components/
│   └── pages/
├── .env.example
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

### 2.3 Shared Package Structure (packages/shared)

```
packages/shared/
├── src/
│   ├── types/                     # Shared TypeScript types
│   │   ├── user.types.ts
│   │   ├── product.types.ts
│   │   ├── order.types.ts
│   │   └── index.ts
│   ├── constants/                 # Shared constants
│   │   ├── order-status.ts
│   │   ├── payment-methods.ts
│   │   └── index.ts
│   ├── utils/                     # Shared utilities
│   │   ├── format-currency.ts
│   │   ├── validate-phone.ts
│   │   └── index.ts
│   └── index.ts                   # Package entry
├── tsconfig.json
└── package.json
```

---

## 3. Environment Configuration

### 3.1 Environment Files

| File               | Purpose                    | Git Status     |
| ------------------ | -------------------------- | -------------- |
| `.env.example`     | Template with placeholders | ✅ Committed   |
| `.env.local`       | Local development          | ❌ Git-ignored |
| `.env.development` | Dev environment            | ❌ Git-ignored |
| `.env.test`        | Test environment           | ❌ Git-ignored |

### 3.2 Backend Environment Variables (.env.example)

```bash
# ===========================================
# TrustCart Kenya - Backend Configuration
# ===========================================
# Copy this file to .env.local and fill in values

# Application
NODE_ENV=development
PORT=3001
API_PREFIX=api
API_VERSION=v1

# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/trustcart_dev?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=CHANGE_ME_IN_PRODUCTION
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# MPesa (Sandbox)
MPESA_CONSUMER_KEY=YOUR_SANDBOX_KEY
MPESA_CONSUMER_SECRET=YOUR_SANDBOX_SECRET
MPESA_PASSKEY=YOUR_SANDBOX_PASSKEY
MPESA_SHORTCODE=174379
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/webhooks/mpesa/callback
MPESA_ENV=sandbox

# Email (Disabled in Local)
EMAIL_ENABLED=false
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=

# SMS (Disabled in Local)
SMS_ENABLED=false
SMS_API_KEY=
SMS_USERNAME=

# Logging
LOG_LEVEL=debug

# CORS
CORS_ORIGINS=http://localhost:3000
```

### 3.3 Frontend Environment Variables (.env.example)

```bash
# ===========================================
# TrustCart Kenya - Frontend Configuration
# ===========================================

# API
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=TrustCart Kenya

# Analytics (Disabled in Local)
NEXT_PUBLIC_ANALYTICS_ENABLED=false

# Feature Flags
NEXT_PUBLIC_ENABLE_POD=true
NEXT_PUBLIC_ENABLE_REVIEWS=false
```

### 3.4 Docker Compose for Local Development

```yaml
# docker/docker-compose.local.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: trustcart-postgres
    environment:
      POSTGRES_USER: trustcart
      POSTGRES_PASSWORD: trustcart_local
      POSTGRES_DB: trustcart_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U trustcart']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: trustcart-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  mailhog:
    image: mailhog/mailhog
    container_name: trustcart-mailhog
    ports:
      - '1025:1025' # SMTP
      - '8025:8025' # Web UI
    profiles:
      - email

volumes:
  postgres_data:
  redis_data:
```

### 3.5 Secrets Management Guide

| Environment | Storage               | Access          |
| ----------- | --------------------- | --------------- |
| Local       | `.env.local` file     | Developer only  |
| Dev         | Cloud Secrets Manager | Dev team (read) |

**Local Development Rules:**

- Never commit `.env.local` or any file with real secrets
- Use placeholder values in `.env.example`
- Rotate local secrets periodically
- Use different passwords from production

---

## 4. Coding Standards & Tooling

### 4.1 Root Configuration Files

**ESLint (`.eslintrc.js`):**

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  ignorePatterns: ['dist/', 'node_modules/', '.next/'],
};
```

**Prettier (`.prettierrc`):**

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

**TypeScript (`tsconfig.base.json`):**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### 4.2 Pre-commit Hooks

**Husky + lint-staged setup:**

```json
// package.json (root)
{
  "scripts": {
    "prepare": "husky install",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

**.husky/pre-commit:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
pnpm type-check
```

### 4.3 Testing Structure

**Backend Test Directories:**

```
apps/api/
├── src/modules/{module}/__tests__/     # Unit tests (co-located)
└── test/                               # E2E tests
    ├── fixtures/                       # Test data
    ├── helpers/                        # Test utilities
    └── *.e2e-spec.ts                  # E2E test files
```

**Frontend Test Directories:**

```
apps/web/
├── __tests__/
│   ├── components/                     # Component tests
│   ├── pages/                          # Page tests
│   └── hooks/                          # Hook tests
└── e2e/                                # Playwright E2E
    ├── fixtures/
    └── *.spec.ts
```

**Test Configuration:**

```json
// apps/api/jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

---

## 5. CI/CD Skeleton

### 5.1 GitHub Actions Workflow (Local/Dev Only)

**.github/workflows/ci.yml:**

```yaml
name: CI Pipeline

on:
  push:
    branches: [develop, 'feature/**']
  pull_request:
    branches: [develop, main]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '8'

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type Check
        run: pnpm type-check

  test-api:
    name: Test Backend
    runs-on: ubuntu-latest
    needs: lint

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: trustcart_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm --filter api prisma generate

      - name: Run Migrations
        run: pnpm --filter api prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/trustcart_test

      - name: Run Tests
        run: pnpm --filter api test:cov
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/trustcart_test
          REDIS_HOST: localhost
          REDIS_PORT: 6379

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: apps/api/coverage/lcov.info
          flags: backend

  test-web:
    name: Test Frontend
    runs-on: ubuntu-latest
    needs: lint

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Tests
        run: pnpm --filter web test:cov

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: apps/web/coverage/lcov.info
          flags: frontend

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test-api, test-web]

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build API
        run: pnpm --filter api build

      - name: Build Web
        run: pnpm --filter web build

      # Placeholder for artifact upload (future)
      # - name: Upload Artifacts
      #   uses: actions/upload-artifact@v4

  # Placeholder for future deployment stages
  # deploy-dev:
  #   name: Deploy to Dev
  #   needs: build
  #   if: github.ref == 'refs/heads/develop'
  #   runs-on: ubuntu-latest
  #   environment: development
  #   steps:
  #     - name: Deploy to Dev Environment
  #       run: echo "Deployment step placeholder"
```

### 5.2 Package Scripts

**Root package.json:**

```json
{
  "name": "trustcart-kenya",
  "private": true,
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "dev:api": "pnpm --filter api dev",
    "dev:web": "pnpm --filter web dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test",
    "test:cov": "pnpm -r test:cov",
    "type-check": "pnpm -r type-check",
    "prepare": "husky install",
    "docker:up": "docker-compose -f docker/docker-compose.local.yml up -d",
    "docker:down": "docker-compose -f docker/docker-compose.local.yml down",
    "db:migrate": "pnpm --filter api prisma migrate dev",
    "db:seed": "pnpm --filter api prisma db seed",
    "db:studio": "pnpm --filter api prisma studio"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.10.0"
}
```

---

## 6. README Scaffolding

### 6.1 Root README.md

```markdown
# TrustCart Kenya

Production-grade electronics e-commerce platform for Kenya.

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** NestJS 10, TypeScript
- **Database:** PostgreSQL 15, Prisma ORM
- **Queue:** BullMQ, Redis 7
- **Runtime:** Node.js 20 LTS

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker (for local services)

### Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Start local services: `pnpm docker:up`
4. Copy environment files:
   - `cp apps/api/.env.example apps/api/.env.local`
   - `cp apps/web/.env.example apps/web/.env.local`
5. Run database migrations: `pnpm db:migrate`
6. Start development: `pnpm dev`

### Available Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `pnpm dev`        | Start all apps in development mode |
| `pnpm dev:api`    | Start backend only                 |
| `pnpm dev:web`    | Start frontend only                |
| `pnpm build`      | Build all apps                     |
| `pnpm test`       | Run all tests                      |
| `pnpm lint`       | Lint all code                      |
| `pnpm docker:up`  | Start local Docker services        |
| `pnpm db:migrate` | Run database migrations            |
| `pnpm db:studio`  | Open Prisma Studio                 |

## Project Structure
```

trustcart-kenya/
├── apps/
│ ├── web/ # Next.js frontend
│ └── api/ # NestJS backend
├── packages/
│ └── shared/ # Shared types and utilities
├── docs/ # Documentation
├── docker/ # Docker configurations
└── .github/ # CI/CD workflows

```

## Documentation

- [Architecture](docs/architecture/)
- [Planning](docs/planning/)

## License

Proprietary - All rights reserved
```

---

## 7. Execution Steps

### Phase 1: Repository Setup

| Step | Command/Action                                   | Verification                 |
| ---- | ------------------------------------------------ | ---------------------------- |
| 1.1  | Create pnpm workspace config                     | `pnpm-workspace.yaml` exists |
| 1.2  | Create root `package.json`                       | Dependencies installable     |
| 1.3  | Create `.gitignore`                              | Sensitive files excluded     |
| 1.4  | Create root configs (ESLint, Prettier, TSConfig) | `pnpm lint` runs             |
| 1.5  | Setup Husky pre-commit hooks                     | Hooks trigger on commit      |

### Phase 2: Backend Scaffolding

| Step | Command/Action                          | Verification                                 |
| ---- | --------------------------------------- | -------------------------------------------- |
| 2.1  | Initialize NestJS project in `apps/api` | `pnpm --filter api dev` starts               |
| 2.2  | Add Prisma and configure schema         | `pnpm --filter api prisma generate` succeeds |
| 2.3  | Create module folder structure          | Folders match spec                           |
| 2.4  | Add `.env.example`                      | Template complete                            |
| 2.5  | Configure Jest                          | `pnpm --filter api test` runs                |

### Phase 3: Frontend Scaffolding

| Step | Command/Action                           | Verification                   |
| ---- | ---------------------------------------- | ------------------------------ |
| 3.1  | Initialize Next.js project in `apps/web` | `pnpm --filter web dev` starts |
| 3.2  | Configure Tailwind CSS                   | Styles apply correctly         |
| 3.3  | Create folder structure                  | Folders match spec             |
| 3.4  | Add `.env.example`                       | Template complete              |
| 3.5  | Configure Jest/Vitest                    | `pnpm --filter web test` runs  |

### Phase 4: Shared Package

| Step | Command/Action                     | Verification             |
| ---- | ---------------------------------- | ------------------------ |
| 4.1  | Create `packages/shared` structure | Package builds           |
| 4.2  | Add shared types                   | Types importable in apps |
| 4.3  | Add shared constants               | Constants importable     |

### Phase 5: Docker & Local Services

| Step | Command/Action                    | Verification                     |
| ---- | --------------------------------- | -------------------------------- |
| 5.1  | Create `docker-compose.local.yml` | `pnpm docker:up` starts services |
| 5.2  | Verify PostgreSQL connection      | Prisma connects                  |
| 5.3  | Verify Redis connection           | BullMQ connects                  |

### Phase 6: CI/CD Setup

| Step | Command/Action                    | Verification               |
| ---- | --------------------------------- | -------------------------- |
| 6.1  | Create `.github/workflows/ci.yml` | Workflow visible in GitHub |
| 6.2  | Test workflow locally (act)       | All jobs pass              |
| 6.3  | Push and verify CI runs           | Green pipeline             |

---

## 8. Verification Plan

### 8.1 Automated Verification

| Check                | Command                            | Expected Result     |
| -------------------- | ---------------------------------- | ------------------- |
| Dependencies install | `pnpm install`                     | No errors           |
| Lint passes          | `pnpm lint`                        | No errors           |
| Type check passes    | `pnpm type-check`                  | No errors           |
| API builds           | `pnpm --filter api build`          | Builds successfully |
| Web builds           | `pnpm --filter web build`          | Builds successfully |
| API tests run        | `pnpm --filter api test`           | Tests pass          |
| Web tests run        | `pnpm --filter web test`           | Tests pass          |
| Docker starts        | `pnpm docker:up`                   | Services healthy    |
| DB connects          | `pnpm --filter api prisma db push` | Schema applied      |

### 8.2 Manual Verification

1. **Start Development Servers:**
   - Run `pnpm dev`
   - Open http://localhost:3000 (frontend)
   - Open http://localhost:3001/api (backend)
   - Verify both respond

2. **Database Connection:**
   - Run `pnpm db:studio`
   - Verify Prisma Studio opens
   - Check connection to PostgreSQL

3. **Pre-commit Hooks:**
   - Make a small code change
   - Attempt to commit
   - Verify lint/type-check runs

4. **CI Pipeline:**
   - Push a branch to GitHub
   - Verify GitHub Actions workflow triggers
   - All jobs should pass

---

## 9. Assumptions & Constraints

### Assumptions

| Assumption                          | Impact if False                    |
| ----------------------------------- | ---------------------------------- |
| Developer has Node.js 20+ installed | Setup will fail                    |
| Developer has Docker installed      | Local services unavailable         |
| Developer has pnpm installed        | Alternative package manager needed |
| GitHub is the repository host       | CI/CD adjustments needed           |

### Constraints

| Constraint           | Reason                                    |
| -------------------- | ----------------------------------------- |
| No business logic    | Scaffolding phase only                    |
| Local/Dev only       | SIT/UAT/Prod require additional approvals |
| No real secrets      | Security requirement                      |
| No high-risk domains | Payment, PII deferred                     |

---

## Document Approval

| Role        | Name | Status  | Date |
| ----------- | ---- | ------- | ---- |
| Tech Lead   | —    | Pending | —    |
| DevOps Lead | —    | Pending | —    |

---

_Upon approval, this plan will be executed to establish the project foundation. No business logic will be implemented during this phase._
