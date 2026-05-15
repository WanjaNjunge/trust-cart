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
| FIND-004 | Reset tokens in in-memory Map | ⬜ OPEN | | |
| FIND-005 | No rate limiting | ⬜ OPEN | | |
| FIND-006 | No Helmet.js | ⬜ OPEN | | |
| FIND-007 | Swagger exposed in production | ⬜ OPEN | | |
| FIND-008 | No max password length (bcrypt DoS) | ⬜ OPEN | | |
| FIND-022 | No logout endpoint *(Phase 1 sub-task)* | ⬜ OPEN | | |
| FIND-036 | Weak JWT secret in local `.env` | ⬜ OPEN | | |

---

## Phase 3 — High-severity infra & CI/CD

| ID | Finding | Status | Files Touched | Verification |
|----|---------|--------|--------------|-------------|
| FIND-016 | JWT in localStorage | ⬜ OPEN | | |
| FIND-029 | No dependency CVE scanning in CI | ⬜ OPEN | | |
| FIND-031 | No TLS/HTTPS enforcement | ⬜ OPEN (runbook) | | |
| FIND-033 | No production environment protection | ⬜ OPEN (runbook) | | |

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
