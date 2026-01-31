# TrustCart Kenya

Production-grade electronics e-commerce platform for Kenya.

## Tech Stack

| Layer    | Technology                           |
| -------- | ------------------------------------ |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend  | NestJS 10, TypeScript                |
| Database | PostgreSQL 15, Prisma ORM            |
| Queue    | BullMQ, Redis 7                      |
| Runtime  | Node.js 20 LTS                       |

## Prerequisites

- Node.js 20+
- pnpm 8+ (`npm install -g pnpm`)
- Docker (for local services)

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start local services (PostgreSQL + Redis)
pnpm docker:up

# 3. Copy environment files
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local

# 4. Generate Prisma client
pnpm db:generate

# 5. Run database migrations
pnpm db:migrate

# 6. Start development servers
pnpm dev
```

## Available Scripts

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `pnpm dev`         | Start all apps in development mode |
| `pnpm dev:api`     | Start backend only                 |
| `pnpm dev:web`     | Start frontend only                |
| `pnpm build`       | Build all apps                     |
| `pnpm test`        | Run all tests                      |
| `pnpm lint`        | Lint all code                      |
| `pnpm type-check`  | Type check all code                |
| `pnpm docker:up`   | Start local Docker services        |
| `pnpm docker:down` | Stop local Docker services         |
| `pnpm db:migrate`  | Run database migrations            |
| `pnpm db:studio`   | Open Prisma Studio                 |

## Project Structure

```
trustcart-kenya/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # NestJS backend
├── packages/
│   └── shared/           # Shared types and utilities
├── docs/
│   ├── architecture/     # Architecture documents
│   └── planning/         # Planning documents
├── docker/               # Docker configurations
└── .github/              # CI/CD workflows
```

## Development URLs

| Service       | URL                   |
| ------------- | --------------------- |
| Frontend      | http://localhost:3000 |
| Backend API   | http://localhost:3001 |
| Prisma Studio | http://localhost:5555 |
| Mailhog UI    | http://localhost:8025 |

## Documentation

- [Architecture](docs/architecture/)
- [Planning](docs/planning/)

## License

Proprietary - All rights reserved
