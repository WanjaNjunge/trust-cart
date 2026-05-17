# Security Remediation Status

**Branch:** `security/remediation-phase-1`  
**Audit report:** `docs/security-audit-report.md`  
**Started:** 2026-05-14

## Baseline (pre-remediation)

| Metric | Value |
|--------|-------|
| API unit tests | 0 (no specs existed) |
| Web unit tests | 0 (no specs existed) |
| `pnpm audit` HIGH findings | 26 high, 25 moderate, 8 low (59 total) |
| Notable CVE | next@14.2.35 — GHSA-36qx-fr4f-26g5 (HIGH, middleware bypass) |

---

## Phase 1 — Critical (auth integrity)

| ID | Finding | Status | Files Touched | Verification |
|----|---------|--------|--------------|-------------|
| FIND-001 | Insecure reset token generation (`Math.random()`) | ✅ RESOLVED | `auth.service.ts`, `auth.service.spec.ts` | 3 unit tests pass; `Math.random` not called |
| FIND-002 | Reset tokens logged in plaintext | ✅ RESOLVED | `auth.service.ts` | `grep console.log apps/api/src/modules/auth/` → 0 matches |
| FIND-003 | JWT never invalidated / no logout / `JWT_EXPIRES_IN` mismatch | ✅ RESOLVED | `auth.service.ts`, `auth.controller.ts`, `jwt.strategy.ts`, `auth.module.ts`, `redis/`, `app.module.ts`, `e2e/auth.spec.ts` | 4 unit tests pass; e2e blacklist round-trip test written; `JWT_EXPIRES_IN` removed from src |

---

## Phase 2 — High-severity middleware & auth surface

| ID | Finding | Status | Files Touched | Verification |
|----|---------|--------|--------------|-------------|
| FIND-004 | Reset tokens in in-memory Map | ✅ RESOLVED | `auth.service.ts`, `redis.service.ts`, `auth.service.spec.ts` | 4 unit tests; Map fully removed; Redis `pwd_reset:{token}` with 86400s TTL |
| FIND-005 | No rate limiting | ✅ RESOLVED | `app.module.ts`, `auth.controller.ts`, `auth.throttle.spec.ts` | 7 config tests; ThrottlerGuard global; strict 5/60s on all auth endpoints |
| FIND-006 | No Helmet.js | ✅ RESOLVED | `main.ts`, `main.spec.ts` | 3 tests; helmet applied before CORS; CSP restricts defaultSrc/frameSrc/objectSrc |
| FIND-007 | Swagger exposed in production | ✅ RESOLVED | `main.ts`, `main.spec.ts` | 2 tests; SwaggerModule.setup() inside NODE_ENV !== production guard |
| FIND-008 | No max password length (bcrypt DoS) | ✅ RESOLVED | `auth.dto.ts`, `auth.dto.spec.ts` | 9 tests; @MaxLength(128) on all 3 DTOs; special char now required |
| FIND-022 | No logout endpoint *(completed Phase 1)* | ✅ RESOLVED | `auth.controller.ts` | Phase 1 — see FIND-003 |
| FIND-036 | Weak JWT secret in local `.env` | ✅ RESOLVED | `main.ts`, `main.spec.ts`, `.env` (gitignored) | 5 tests; startup throws FATAL on weak secret in non-dev/test; local .env rotated |

---

## Phase 3 — High-severity infra & CI/CD

| ID | Finding | Status | Files Touched | Verification |
|----|---------|--------|--------------|-------------|
| FIND-016 | JWT in localStorage | ✅ RESOLVED | `jwt.strategy.ts`, `auth.controller.ts`, `main.ts`, `auth.ts` (web), `api.ts` (web), `login/page.tsx`, `e2e/helpers/auth.ts`, `e2e/auth.spec.ts` | 2 e2e tests verify Set-Cookie HttpOnly; `getToken()` always returns null; `credentials:'include'` on all fetch calls |
| FIND-029 | No dependency CVE scanning in CI | ✅ RESOLVED | `.github/workflows/ci.yml`, `.github/dependabot.yml` | `security-audit` job added (pnpm audit --audit-level=high); Dependabot weekly; auto-merge disabled |
| FIND-031 | No TLS/HTTPS enforcement | 📄 DEFERRED | `docs/security/tls-deployment.md` | Runbook covers Railway/Render/Fly.io, nginx, Caddy, HSTS config, post-deploy verification |
| FIND-033 | No production environment protection | 📄 DEFERRED | `docs/security/github-environment-protection.md` | Runbook covers branch protection, 2-reviewer production env, secrets isolation, CODEOWNERS |

---

## Phase 4 — Medium-severity

| ID | Finding | Status | Files Touched | Verification |
|----|---------|--------|--------------|-------------|
| FIND-009 | RolesGuard default-allow | ⬜ OPEN | | |
| FIND-010 | IDOR in payment endpoint | ⬜ OPEN | | |
| FIND-011 | No phone format validation | ⬜ OPEN | | |
| FIND-012 | No request body size limits | ⬜ OPEN | | |
| FIND-013 | No pagination max limit | ⬜ OPEN | | |
| FIND-018 | No CSP on frontend | ⬜ OPEN | | |
| FIND-020 | CORS allows localhost:3001 | ⬜ OPEN | | |
| FIND-021 | No global exception filter | ⬜ OPEN | | |
| FIND-023 | Redis no authentication | ⬜ OPEN | | |
| FIND-026 | No DB SSL | ⬜ OPEN | | |
| FIND-027 | PII in plaintext | ⬜ OPEN (design doc) | | |
| FIND-032 | PostgreSQL exposed on all interfaces | ⬜ OPEN | | |
| FIND-037 | No startup env var validation | ⬜ OPEN | | |

---

## Phase 5 — Low / Informational

| ID | Finding | Status | Files Touched | Verification |
|----|---------|--------|--------------|-------------|
| FIND-014 | PoD county dead-code bug | ⬜ OPEN | | |
| FIND-015 | idempotencyKey uses Date.now() | ⬜ OPEN | | |
| FIND-019 | NEXT_PUBLIC_ variable awareness | ⬜ OPEN | | |
| FIND-024 | enableImplicitConversion | ⬜ OPEN | | |
| FIND-025 | Raw SQL pattern documentation | ⬜ OPEN | | |
| FIND-028 | No Prisma row-level middleware | ⬜ OPEN | | |
| FIND-034 | No Dockerfile | ⬜ OPEN | | |
| FIND-035 | Hardcoded test secrets in CI | ⬜ OPEN | | |
| FIND-038 | .env.example MPesa exposure | ℹ️ INFORMATIONAL | | |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ⬜ OPEN | Not yet started |
| 🔄 IN PROGRESS | Being worked on |
| ✅ RESOLVED | Fixed + test verified |
| 📄 DEFERRED | Documented only (infra/post-MVP) |
| ℹ️ INFORMATIONAL | No code change required |
