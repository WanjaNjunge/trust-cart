# TrustCart Kenya — Security Audit Report

**Classification:** Pre-Production Security Assessment  
**Prepared by:** Senior Application Security Engineer / DevSecOps Architect  
**Assessment Date:** 2026-05-14  
**Scope:** Full-stack monorepo — NestJS API, Next.js Frontend, PostgreSQL, Redis, Docker, CI/CD  
**Application Version:** MVP (Phase 8 implementation)  
**Assessment Type:** White-Box Source Code Review + Architecture Analysis + Penetration Testing Mindset

---

## 1. Executive Security Summary

TrustCart Kenya is a fintech-adjacent e-commerce application handling real money transactions (MPesa, Pay on Delivery), customer PII (names, phones, addresses), and privileged admin operations (inventory management, order status transitions, refunds). The security bar must be treated as equivalent to a financial application.

This audit reviewed **all major security surfaces**: authentication system, API authorization, frontend token handling, backend middleware, database access, secrets management, infrastructure configuration, and CI/CD pipelines.

**Overall Security Posture: POOR — NOT SECURE FOR PRODUCTION DEPLOYMENT**

The application has a functional and well-architected codebase, but multiple critical and high-severity vulnerabilities exist that must be resolved before any production deployment. The most urgent concerns are:

1. The complete absence of HTTP security headers (no Helmet.js)
2. No rate limiting on any endpoint, including authentication flows
3. Cryptographically insecure password reset token generation using `Math.random()`
4. Plaintext logging of password reset tokens to the console
5. JWT tokens defaulting to a 7-day expiry with no revocation capability
6. Swagger API documentation fully exposed in all environments

Four findings are rated **Critical**, nine are rated **High**, eleven are rated **Medium**, and five are rated **Low** or **Informational**.

---

## 2. Authentication & Authorization Findings

### FIND-001 — Cryptographically Insecure Password Reset Token Generation
**Severity:** CRITICAL  
**File:** [apps/api/src/modules/auth/auth.service.ts](apps/api/src/modules/auth/auth.service.ts#L173-L180)

```typescript
private generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));  // ← INSECURE
  }
  return token;
}
```

`Math.random()` is not a cryptographically secure pseudo-random number generator (CSPRNG). It is seeded deterministically in V8 and its output is predictable given knowledge of system state. An attacker who can observe timing or other oracle signals can narrow the token space dramatically and brute-force valid reset tokens, enabling full account takeover for any user who requested a password reset.

The 62-character alphabet over 32 characters yields log₂(62³²) ≈ 190 bits of *theoretical* entropy but far less practical entropy because `Math.random()`'s internal state is only 64 bits wide. The effective keyspace is ~2⁶⁴ or less — attackable offline given enough observations.

**Exploitation risk:** Account takeover via password reset token prediction.

**Recommended fix:**
```typescript
import { randomBytes } from 'crypto';

private generateResetToken(): string {
  return randomBytes(32).toString('hex'); // 256 bits of CSPRNG entropy
}
```

---

### FIND-002 — Password Reset Tokens Logged in Plaintext
**Severity:** CRITICAL  
**File:** [apps/api/src/modules/auth/auth.service.ts](apps/api/src/modules/auth/auth.service.ts#L140-L141)

```typescript
console.log(`[Auth] Password reset token for ${user.email}: ${token}`);
console.log(`[Auth] Reset link: http://localhost:3000/reset-password?token=${token}`);
```

Password reset tokens are security credentials equivalent to temporary passwords. Logging them to `console.log` means they appear in:
- Server logs aggregated to Datadog, CloudWatch, Papertrail, or any log management system
- Container stdout captured by Docker logging drivers
- CI/CD build logs (if tests trigger reset flows)
- Any monitoring solution with log forwarding

Any person with access to application logs can extract valid reset tokens and take over user accounts. This is a complete authentication bypass.

**Exploitation risk:** Any log reader can extract active reset tokens and take over user accounts without knowing their password.

**Recommended fix:**
```typescript
// Replace console.log with structured logger that does NOT include the token
this.logger.log(`[Auth] Password reset requested for user: ${user.id}`);
// In production: send via email service, never log the token itself
await this.emailService.sendPasswordReset(user.email, resetLink);
```

---

### FIND-003 — JWT Tokens Never Invalidated (No Logout, No Revocation)
**Severity:** CRITICAL  
**Files:** [apps/api/src/modules/auth/auth.controller.ts](apps/api/src/modules/auth/auth.controller.ts), [apps/api/src/modules/auth/jwt.strategy.ts](apps/api/src/modules/auth/strategies/jwt.strategy.ts)

There is no logout endpoint in the authentication controller. The JWT strategy validates tokens by checking database `isActive` status, but tokens themselves are never revoked. Consequences:

- A user who "logs out" on the frontend (clears localStorage) still has a valid token that works for the full 7-day expiry window
- If an account is compromised and an admin deactivates it (`isActive = false`), any stolen JWT remains valid for up to 7 days
- Role downgrades (e.g., ADMIN → CUSTOMER) are not reflected in existing tokens until they expire
- No way to force-expire a specific user's session

**Exploitation risk:** Stolen or leaked tokens remain usable for the full token lifetime; no emergency revocation path exists.

**JWT expiry misconfiguration (related):** `auth.module.ts` line 19 reads `JWT_EXPIRES_IN` with default `7d`. However, `.env.example` defines `JWT_ACCESS_EXPIRY=15m`. The environment variable name mismatch means the `15m` value is **never read**, and all tokens default to 7 days — not the documented 15 minutes.

```typescript
// auth.module.ts:19 — reads JWT_EXPIRES_IN
const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '7d';

// .env.example — defines JWT_ACCESS_EXPIRY (different name, never read)
JWT_ACCESS_EXPIRY=15m
```

**Recommended fix:**
1. Implement a POST `/auth/logout` endpoint
2. Add a Redis-backed token blacklist or use short-lived tokens (15 min) with refresh tokens
3. Fix the env var name: use `JWT_ACCESS_EXPIRY` consistently throughout
4. On role changes, store a `tokenIssuedBefore` timestamp on the User model and reject older tokens

---

### FIND-004 — Password Reset Tokens Stored in In-Memory Map
**Severity:** HIGH  
**File:** [apps/api/src/modules/auth/auth.service.ts](apps/api/src/modules/auth/auth.service.ts#L21)

```typescript
// In-memory store for password reset tokens (use Redis in production)
const passwordResetTokens = new Map<string, { userId: string; expiresAt: Date }>();
```

Password reset tokens are stored in a JavaScript `Map` at module scope. This means:
- All pending reset tokens are **lost on every server restart or deployment**
- In a horizontally scaled environment (multiple pods/containers), tokens are not shared — a reset initiated on server A cannot be validated by server B
- The comment acknowledges this is not production-safe but it has not been addressed

**Recommended fix:**
```typescript
// Store in Redis with TTL (self-expiring)
await this.redis.setex(
  `pwd_reset:${token}`,
  86400, // 24 hours in seconds
  JSON.stringify({ userId: user.id })
);
```

---

### FIND-005 — No Brute Force or Rate Limiting on Authentication Endpoints
**Severity:** HIGH  
**Files:** [apps/api/src/main.ts](apps/api/src/main.ts), [apps/api/.env.example](apps/api/.env.example)

The `.env.example` defines `RATE_LIMIT_TTL=60` and `RATE_LIMIT_MAX=100`, but these values are never consumed. A search across the entire `apps/api/src` directory confirms zero usage of `@nestjs/throttler` or any rate limiting middleware.

The following endpoints are completely unprotected against brute force:
- `POST /api/v1/auth/login` — unlimited password guessing attempts
- `POST /api/v1/auth/register` — unlimited account creation (registration flooding)
- `POST /api/v1/auth/forgot-password` — unlimited reset requests (email flooding)
- `POST /api/v1/auth/reset-password` — unlimited token guessing attempts
- `POST /api/v1/checkout` — unlimited order creation (inventory depletion abuse)
- `POST /api/v1/cart/items` — unlimited cart additions

An automated tool can attempt 100,000 password combinations per minute against any account with no throttling or lockout.

**Recommended fix:**
```bash
pnpm --filter api add @nestjs/throttler
```
```typescript
// app.module.ts
ThrottlerModule.forRoot([{
  name: 'short',
  ttl: 1000,
  limit: 3,
}, {
  name: 'medium',
  ttl: 60000,
  limit: 20,
}]),

// auth.controller.ts — apply strict limits to auth routes
@UseGuards(ThrottlerGuard)
@Throttle({ short: { limit: 5, ttl: 60000 } })
@Post('login')
```

---

### FIND-006 — No HTTP Security Headers (Helmet.js Not Installed)
**Severity:** HIGH  
**File:** [apps/api/src/main.ts](apps/api/src/main.ts)

Helmet.js is not imported, installed, or applied anywhere in the NestJS application. A search for "helmet" across all TypeScript source files returns zero results. The following headers are entirely absent from every API response:

| Header | Missing Protection |
|--------|-------------------|
| `X-Frame-Options` | Clickjacking attacks |
| `X-Content-Type-Options: nosniff` | MIME type sniffing |
| `Strict-Transport-Security` | HTTP downgrade attacks |
| `X-XSS-Protection` | Reflected XSS in older browsers |
| `Content-Security-Policy` | XSS, data injection, clickjacking |
| `Referrer-Policy` | Referrer leakage |
| `Permissions-Policy` | Browser feature abuse |
| `Cross-Origin-Opener-Policy` | Cross-origin isolation |

**Exploitation risk:** Clickjacking on the Swagger UI and admin pages, MIME confusion attacks, absence of HSTS makes HTTPS downgrade attacks possible.

**Recommended fix:**
```bash
pnpm --filter api add helmet
```
```typescript
// main.ts — add before CORS and routes
import helmet from 'helmet';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

---

### FIND-007 — Swagger UI Exposed in All Environments Without Authentication
**Severity:** HIGH  
**File:** [apps/api/src/main.ts](apps/api/src/main.ts#L49-L50)

```typescript
// No environment check — Swagger is always enabled
SwaggerModule.setup('api/docs', app, document);
```

The full Swagger/OpenAPI UI is accessible at `/api/docs` in all environments including production. This exposes:
- Complete API endpoint inventory (all routes, methods, parameters)
- All request/response schema definitions
- All enum values (including internal ones like `UserRole.ADMIN`)
- Interactive "Try it out" functionality that can directly attack the API
- Authentication structure (Bearer token fields)

This is a significant information disclosure and attack surface amplification issue.

**Exploitation risk:** Attackers can enumerate all endpoints, understand parameter formats, and use the interactive UI to attempt attacks without needing to reverse-engineer the API.

**Recommended fix:**
```typescript
// main.ts — disable Swagger in production
if (process.env.NODE_ENV !== 'production') {
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
  logger.log('Swagger docs: http://localhost:${port}/api/docs');
}
```

---

### FIND-008 — No Maximum Password Length Allows DoS via bcrypt
**Severity:** HIGH  
**File:** [apps/api/src/modules/auth/dto/auth.dto.ts](apps/api/src/modules/auth/dto/auth.dto.ts#L9-L15)

```typescript
@IsString()
@MinLength(8)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { ... })
password!: string;  // ← No @MaxLength()
```

bcrypt truncates input at 72 bytes. However, hashing a very long string (e.g., 1 MB) still takes significant CPU time before truncation is applied by some bcrypt implementations. Without a maximum password length, an attacker can send a `POST /auth/login` with a 10 MB password string and cause the bcrypt call to consume excessive CPU, potentially degrading service for all users.

**Recommended fix:**
```typescript
@IsString()
@MinLength(8)
@MaxLength(128)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
  message: 'Password must include lowercase, uppercase, number, and special character',
})
password!: string;
```
The same fix is needed in `ResetPasswordDto` at [apps/api/src/modules/auth/dto/auth.dto.ts](apps/api/src/modules/auth/dto/auth.dto.ts#L54-L60).

---

### FIND-009 — RolesGuard Returns `true` When No Roles Decorator Present
**Severity:** MEDIUM  
**File:** [apps/api/src/common/guards/roles.guard.ts](apps/api/src/common/guards/roles.guard.ts#L15-L17)

```typescript
if (!requiredRoles) {
  return true;  // ← Allows access if @Roles() is not applied
}
```

If `RolesGuard` is applied at the controller level but a route handler is added without `@Roles(...)`, all authenticated users including CUSTOMER role gain access. This is a default-allow pattern for an authorization guard on privileged resources. While current implementation appears correct (all admin routes have `@Roles`), new developers could accidentally add admin routes without `@Roles`, silently granting access to all authenticated users.

**Recommended fix:** Default to deny-all: throw `ForbiddenException` if `requiredRoles` is empty when applied to an admin controller.

---

### FIND-010 — IDOR Risk in Payment Endpoint (Guest Payment Access)
**Severity:** MEDIUM  
**File:** [apps/api/src/modules/payments/payments.service.ts](apps/api/src/modules/payments/payments.service.ts#L46-L48)

```typescript
// Verify user ownership if logged in
if (userId && order.userId !== userId) {
  throw new BadRequestException('Order does not belong to user');
}
```

The ownership check is only applied **if the user is logged in** (`if (userId && ...)`). A guest user with no JWT can call `POST /api/v1/payments/initiate` with any `orderId` and successfully initiate a payment against any order — including other customers' orders. This allows:
- Marking another customer's pending order as initiating payment
- Potentially confirming orders they don't own (for PoD)

**Recommended fix:** Require proof of ownership for all checkout and payment operations regardless of auth state (e.g., validate that the `sessionId` or email matches the order).

---

### FIND-011 — Phone Number Accepts Arbitrary String Input (No Format Validation)
**Severity:** MEDIUM  
**File:** [apps/api/src/modules/auth/dto/auth.dto.ts](apps/api/src/modules/auth/dto/auth.dto.ts#L27-L30)

```typescript
@IsOptional()
@IsString()
phone?: string;   // ← No format, length, or pattern validation
```

Similarly in [apps/api/src/modules/payments/dto/initiate-payment.dto.ts](apps/api/src/modules/payments/dto/initiate-payment.dto.ts#L11-L13):
```typescript
@IsOptional()
@IsString()
phoneNumber?: string;  // ← No Kenyan phone number format validation
```

An attacker can store arbitrary strings (including XSS payloads, SQL fragments, or very long strings) as phone numbers. While Prisma prevents SQL injection, stored XSS in phone fields rendered in admin dashboards is a genuine risk.

**Recommended fix:**
```typescript
@Matches(/^254[17]\d{8}$/, { message: 'Phone must be a valid Kenyan number (254XXXXXXXXX)' })
@MaxLength(13)
phoneNumber?: string;
```

---

## 3. API Security Findings

### FIND-012 — No Request Body Size Limits
**Severity:** MEDIUM  
**File:** [apps/api/src/main.ts](apps/api/src/main.ts)

NestJS uses Express under the hood with a default body size limit of 100kb. However, there is no explicit configuration of this limit, and no check for multipart/file upload abuse. If file upload endpoints are added in the future without explicit size limits, arbitrarily large payloads could be accepted.

**Recommended fix:**
```typescript
import * as express from 'express';
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ limit: '50kb', extended: true }));
```

---

### FIND-013 — No Pagination Maximum on Order History and Admin Endpoints
**Severity:** MEDIUM  
**File:** [apps/api/src/modules/orders/orders.controller.ts](apps/api/src/modules/orders/orders.controller.ts#L84-L89)

```typescript
@Query('limit') limit?: string,
// ...
limit ? parseInt(limit, 10) : 10,  // ← No maximum cap
```

The `GET /orders` endpoint accepts an arbitrary `limit` query parameter without a maximum. A user could pass `limit=999999` and retrieve all their orders in a single query, causing a database-intensive operation. The admin orders and inventory endpoints at [apps/api/src/modules/admin/admin-orders.controller.ts](apps/api/src/modules/admin/admin-orders.controller.ts#L39-L40) have the same issue — no `@Max()` decorator on the limit parameter.

Note: The products endpoint correctly uses `@Max(100)` in its DTO — that pattern should be applied universally.

**Recommended fix:** Add `@Max(100)` to all pagination limit parameters, and validate/cap the value in service layers.

---

### FIND-014 — PoD County Validation Contains Dead Code Logic Bug
**Severity:** LOW (business logic, not security-critical)  
**File:** [apps/api/src/modules/payments/payments.service.ts](apps/api/src/modules/payments/payments.service.ts#L131-L138)

```typescript
const allowedCounties = ['Nairobi', 'Kiambu', 'Kajiado', 'Machakos'];
if (order.address && !allowedCounties.includes(order.address.county)) {
  // Note: county validation is case-sensitive here but case-insensitive during order creation
  if (!allowedCounties.includes(order.address.county)) {  // ← Redundant inner check
    throw new BadRequestException('...');
  }
}
```

The inner `if` is identical to the outer condition — the inner check is always true when the outer block is entered. Additionally, the allowed counties array uses title case (`'Nairobi'`) but `calculateDeliveryFee()` normalizes to lowercase (`county.toLowerCase()`). If the county stored in the database is lowercase, this validation silently passes PoD for all counties.

---

### FIND-015 — idempotencyKey Uses `Date.now()` (Millisecond Collision Risk)
**Severity:** LOW  
**File:** [apps/api/src/modules/payments/payments.service.ts](apps/api/src/modules/payments/payments.service.ts#L150)

```typescript
idempotencyKey: `POD-${order.id}-${Date.now()}`,
```

`Date.now()` has millisecond precision. Under concurrent requests (or automated testing), two payment initiations for the same order within the same millisecond would generate identical idempotency keys, potentially causing a unique constraint violation or unintended idempotency collapse.

**Recommended fix:**
```typescript
import { randomUUID } from 'crypto';
idempotencyKey: `POD-${order.id}-${randomUUID()}`,
```

---

## 4. Frontend Security Findings

### FIND-016 — JWT Token Stored in localStorage (XSS Attack Surface)
**Severity:** HIGH  
**File:** [apps/web/src/lib/auth.ts](apps/web/src/lib/auth.ts#L5-L16)

```typescript
const TOKEN_KEY = 'trustcart_token';
const USER_KEY = 'trustcart_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);  // ← XSS-accessible
}
```

Storing authentication tokens in `localStorage` is a well-known security anti-pattern. Any JavaScript that executes in the browser context — including third-party scripts, injected ads, browser extension bugs, or XSS vulnerabilities — can read `localStorage` and steal the token.

The token grants full API access including order placement, address management, and personal data retrieval. If any XSS vulnerability exists anywhere on the site (including in third-party libraries), the token is immediately exfiltrated.

**Exploitation risk:** One XSS anywhere on the site → full account takeover for any user currently logged in.

**Recommended fix (for production):** Use `HttpOnly` cookies with `Secure`, `SameSite=Strict` attributes. The cookie cannot be read by JavaScript, only sent by the browser automatically. This requires the API to set the cookie on login and the frontend to not manage tokens manually.

For MVP, at minimum add a CSP header to limit script execution surfaces.

---

### FIND-017 — No dangerouslySetInnerHTML Usage (Positive Finding)
**Severity:** Informational (PASS)  
**Scope:** All files in `apps/web/src/`

A full search for `dangerouslySetInnerHTML` across all frontend source files returned no matches. This is a positive finding — no unsafe HTML injection via React's escape hatch.

---

### FIND-018 — No Content Security Policy Header on Frontend
**Severity:** MEDIUM  
**File:** `apps/web/next.config.js` (not configured)

The Next.js frontend does not configure a Content Security Policy header. Without CSP:
- Injected scripts from any domain can execute
- Inline scripts are unrestricted
- Data exfiltration via `img src` or `fetch` to attacker-controlled origins is unrestricted

**Recommended fix (next.config.js):**
```javascript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",  // refine for production
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.trustcart.co.ke",
      "frame-ancestors 'none'",
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];
```

---

### FIND-019 — NEXT_PUBLIC_ Variables Exposed at Build Time
**Severity:** LOW (Design Awareness)  
**File:** [apps/web/.env.example](apps/web/.env.example)

All `NEXT_PUBLIC_*` environment variables are bundled into the client-side JavaScript and visible to any user. This is by design for Next.js, but the team must never add sensitive values (API keys, secrets) with the `NEXT_PUBLIC_` prefix. Current usage (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ENABLE_POD`) is appropriate.

---

## 5. Backend Security Findings

### FIND-020 — CORS Configuration Does Not Strictly Validate Origins
**Severity:** MEDIUM  
**File:** [apps/api/src/main.ts](apps/api/src/main.ts#L15-L20)

```typescript
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
app.enableCors({
  origin: corsOrigins,    // ← Array passed directly; NestJS uses exact string match
  credentials: true,      // ← credentials: true with wildcard origins is blocked, but...
});
```

The `credentials: true` setting in combination with origin validation relies on NestJS/Express doing exact string comparison. This is functionally correct for string arrays but does not validate that `CORS_ORIGINS` is set in production. If the env var is empty/undefined, it falls back to allowing only `http://localhost:3000` — which is fine — but there is no startup validation that `CORS_ORIGINS` is set in production.

Additionally, `http://localhost:3001` is listed in `.env.example` as an allowed origin, meaning the API itself is in its own CORS allowlist, which could enable same-origin attacks if exploited.

**Recommended fix:**
```typescript
// Validate CORS origins at startup
const corsOrigins = process.env.CORS_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean);
if (process.env.NODE_ENV === 'production' && (!corsOrigins || corsOrigins.length === 0)) {
  throw new Error('CORS_ORIGINS must be configured in production');
}
```

---

### FIND-021 — No Global Exception Filter (Stack Trace Exposure Risk)
**Severity:** MEDIUM  
**File:** [apps/api/src/common/filters/index.ts](apps/api/src/common/filters/index.ts)

```typescript
export {};  // ← Empty — no exception filters implemented
```

The `filters/` directory is empty. NestJS's default exception handler may expose internal error details, stack traces, or database error messages in non-production environments. In production, unhandled exceptions from Prisma (e.g., constraint violations) can leak table names, column names, and query structure.

**Recommended fix:**
```typescript
// common/filters/http-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Never leak internal errors in production
    const message = process.env.NODE_ENV === 'production'
      ? 'An error occurred'
      : (exception as Error).message;

    response.status(status).json({ statusCode: status, message, timestamp: new Date().toISOString() });
  }
}
```

---

### FIND-022 — No Logout Endpoint in Authentication Controller
**Severity:** HIGH  
**File:** [apps/api/src/modules/auth/auth.controller.ts](apps/api/src/modules/auth/auth.controller.ts)

The auth controller has `register`, `login`, `forgot-password`, and `reset-password` — but no `logout`. Without a server-side logout:
- The frontend can only clear localStorage (client-side only)
- The JWT remains valid server-side until its 7-day expiry
- No server-side session invalidation is possible

This is related to FIND-003 but listed separately as a missing endpoint.

---

### FIND-023 — Redis Has No Authentication (No Password Set)
**Severity:** MEDIUM  
**File:** [docker/docker-compose.local.yml](docker/docker-compose.local.yml#L19-L31)

```yaml
redis:
  image: redis:7-alpine
  ports:
    - '6379:6379'  # ← Exposed on all interfaces
  command: redis-server --appendonly yes  # ← No --requirepass
```

The Redis instance:
1. Has no password (`requirepass` not configured)
2. Is bound to all network interfaces (`0.0.0.0:6379`)
3. Contains BullMQ job queues including `order.status_changed` and `order.confirmed` notification jobs

An attacker on the same network can connect to Redis, read all queue jobs (including order numbers, user emails, phone numbers), inject fake jobs, or flush the queue. In production deployment, Redis should be on an internal network only with no public exposure.

**Recommended fix (docker-compose):**
```yaml
redis:
  image: redis:7-alpine
  ports:
    - '127.0.0.1:6379:6379'  # Bind to localhost only
  command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
```
And in the application:
```typescript
connection: {
  host: configService.get('REDIS_HOST', 'localhost'),
  port: configService.get('REDIS_PORT', 6379),
  password: configService.get('REDIS_PASSWORD'),  // Required in production
},
```

---

### FIND-024 — ValidationPipe `enableImplicitConversion` Creates Type Coercion Risks
**Severity:** LOW  
**File:** [apps/api/src/main.ts](apps/api/src/main.ts#L28-L30)

```typescript
transformOptions: {
  enableImplicitConversion: true,  // ← Can coerce unexpected types
},
```

Implicit type conversion in `class-transformer` means that if a string like `"true"`, `"1"`, or `"false"` is passed where a boolean is expected, it is silently converted. This can lead to unexpected behavior in authorization checks or filter logic where `"false"` might be converted to `true`.

**Recommended fix:** Remove `enableImplicitConversion: true` and use explicit `@Type(() => Number)`, `@Type(() => Boolean)` decorators where type transformation is needed.

---

## 6. Database Security Findings

### FIND-025 — Raw SQL Query in Admin Service (Verify Parameterization)
**Severity:** LOW (Verified Safe — Documented)  
**File:** [apps/api/src/modules/admin/admin.service.ts](apps/api/src/modules/admin/admin.service.ts#L14-L17)

```typescript
const lowStockResult = await this.prisma.$queryRaw<[{ count: bigint }]>(
  Prisma.sql`SELECT COUNT(*)::int AS count FROM inventory_records WHERE quantity_on_hand <= reorder_threshold`,
);
```

This raw query uses `Prisma.sql` template literals which are safely parameterized by Prisma. No user input is interpolated. The query is safe from SQL injection as written. However, any future raw queries must follow this same pattern — never use string concatenation with `$queryRaw`.

**Risk:** Low (pattern is safe). Flag for future developer awareness.

---

### FIND-026 — No Database Connection Encryption (SSL/TLS)
**Severity:** MEDIUM  
**File:** [apps/api/.env.example](apps/api/.env.example#L14)

```
DATABASE_URL="postgresql://trustcart:trustcart_local@localhost:5432/trustcart_dev?schema=public"
```

The database connection URL does not include SSL parameters (`?sslmode=require`). In production, database traffic transmitted without encryption allows network-level interception of all queries and results, including customer PII and payment data.

**Recommended fix (production DATABASE_URL):**
```
DATABASE_URL="postgresql://user:pass@db-host:5432/trustcart?schema=public&sslmode=require&sslcert=...&sslkey=..."
```

---

### FIND-027 — PII Stored in Plaintext (No Field-Level Encryption)
**Severity:** MEDIUM  
**File:** `apps/api/prisma/schema.prisma` (User, Order, OrderAddress, MpesaTransaction models)

Customer PII stored in plaintext in the database includes:
- Phone numbers (User.phone, OrderAddress.phone, MpesaTransaction fields)
- Physical addresses (OrderAddress.line1, line2, city, county)
- Names (User.firstName, User.lastName, OrderAddress.recipientName)

In the event of a database breach, all customer PII is immediately exposed in plaintext. For a fintech-adjacent application targeting Kenyan consumers, this may also have implications under Kenya's Data Protection Act 2019.

**Recommended (post-MVP for production):** Field-level encryption for phone numbers and addresses using AES-256-GCM with keys stored in a secrets manager (AWS KMS, HashiCorp Vault).

---

### FIND-028 — No Row-Level Security Enforcement on Prisma Middleware
**Severity:** LOW  
**Assessment:** The application correctly uses `where: { userId }` filters on all user-scoped queries. No global Prisma middleware enforces this, meaning a developer error (forgetting the `userId` filter) would expose all users' data. Current code appears correct.

**Recommended:** Add Prisma middleware for tenancy enforcement as defense-in-depth.

---

## 7. Dependency & Supply Chain Findings

### FIND-029 — No Automated Dependency Vulnerability Scanning in CI
**Severity:** HIGH  
**File:** [.github/workflows/ci.yml](.github/workflows/ci.yml)

The CI pipeline runs lint, type-check, tests, and builds — but does NOT include:
- `pnpm audit` (checks for known CVEs in dependencies)
- Dependabot configuration
- SAST (Static Application Security Testing) tooling
- Secret scanning (e.g., Gitleaks, TruffleHog)
- Software Composition Analysis (SCA)

**Recommended fix — add to CI:**
```yaml
- name: Security Audit
  run: pnpm audit --audit-level=high
  continue-on-error: false  # Fail CI on high/critical CVEs
```

Also create `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-patch"]
```

---

### FIND-030 — Key Dependencies Should Be Audited
**Severity:** Informational  

Run `pnpm audit` to identify current CVEs. Key packages to verify:
- `bcrypt` — password hashing (ensure no timing attack vulnerabilities)
- `passport-jwt` — JWT validation
- `bullmq` — queue processing (ensure no arbitrary code execution via job data)
- `class-validator` / `class-transformer` — known to have had prototype pollution issues; ensure latest versions
- `@prisma/client` — ORM (ensure no SQL injection bypass in older versions)
- `next` — Next.js (frequent security patches)

---

## 8. Infrastructure & Deployment Findings

### FIND-031 — No HTTPS Enforcement or TLS Configuration
**Severity:** HIGH  
**Files:** [apps/api/src/main.ts](apps/api/src/main.ts), [docker/docker-compose.local.yml](docker/docker-compose.local.yml)

The application has no TLS/HTTPS configuration. There is no:
- HTTPS listener configured in NestJS
- `Strict-Transport-Security` header (requires Helmet.js — FIND-006)
- HTTP-to-HTTPS redirect
- TLS certificate configuration

In production, all traffic including JWT tokens (in Authorization headers), payment phone numbers, and customer data would transit unencrypted if deployed without a TLS-terminating reverse proxy.

**Deployment requirement:** A TLS-terminating proxy (nginx, Caddy, Cloudflare Tunnel, or platform-managed TLS from Railway/Render/Fly.io) must be placed in front of the API before production deployment.

---

### FIND-032 — PostgreSQL Exposed on All Interfaces in Docker
**Severity:** MEDIUM  
**File:** [docker/docker-compose.local.yml](docker/docker-compose.local.yml#L9-L10)

```yaml
ports:
  - '5432:5432'  # Exposed on 0.0.0.0:5432 by default
```

The PostgreSQL container is bound to all network interfaces, not just localhost. On a developer machine this is acceptable, but if the same compose file is used in a cloud VM without a firewall, the database would be directly internet-accessible with the weak credentials `trustcart / trustcart_local`.

**Recommended fix:**
```yaml
ports:
  - '127.0.0.1:5432:5432'  # localhost only
```

---

### FIND-033 — No Production Environment Isolation Mechanism
**Severity:** HIGH  
**File:** [.github/workflows/ci.yml](.github/workflows/ci.yml)

The CI pipeline has no deployment stages and no environment protection rules. There is no:
- Production deployment workflow
- Required reviewer approval for production deployments
- Environment secrets isolation between staging and production
- Branch protection rules enforcing PR review before merging to `main`

For a fintech application, production deployments should require at minimum two-person authorization.

---

## 9. Docker & DevOps Findings

### FIND-034 — No Dockerfile (Cannot Audit Container Security)
**Severity:** Informational  

No `Dockerfile` exists in the repository. Only `docker-compose.local.yml` is present for local development using official images (postgres:15-alpine, redis:7-alpine, mailhog/mailhog). Alpine-based images are appropriate (minimal attack surface).

Before production deployment, custom Dockerfiles must be created for the NestJS API and Next.js frontend, following these requirements:
- Use non-root user (e.g., `USER node`)
- Multi-stage build to exclude dev dependencies from production image
- No secrets baked into image layers
- Pin exact image digests (not floating tags like `node:20-alpine`)

---

### FIND-035 — CI/CD Contains Hardcoded Test Secrets
**Severity:** LOW (Acceptable for CI — Documented)  
**File:** [.github/workflows/ci.yml](.github/workflows/ci.yml#L103)

```yaml
JWT_SECRET: test-secret-key          # Line 103 — unit test job
JWT_SECRET: ci-e2e-not-for-production  # Line 262 — e2e job
```

These are intentionally weak secrets for test environments only. They are acceptable in CI configuration files since they are not production secrets. However, they should be clearly documented as test-only, and the CI workflow should validate that `NODE_ENV=test` is enforced when these are in use.

---

## 10. Secrets & Environment Findings

### FIND-036 — Weak JWT Secret in Local `.env` File
**Severity:** HIGH  
**File:** [apps/api/.env](apps/api/.env) (local only — not committed per `.gitignore`)

```
JWT_SECRET=trustcart-dev-secret-key-change-in-production
```

The local `.env` file (correctly excluded from git via `.gitignore`) contains a predictable, weak JWT signing secret. If this value is accidentally used in production (e.g., copy-pasted or used as default), all JWT tokens can be forged by anyone who knows or guesses this value.

**Verification:** The `.gitignore` correctly lists `.env`. Confirm the file is not in git history:
```bash
git log --all --full-history -- "apps/api/.env"
```

**Recommended fix for production:** Generate a cryptographically secure secret and store in a secrets manager:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### FIND-037 — No Startup Validation for Required Environment Variables
**Severity:** MEDIUM  
**File:** [apps/api/src/main.ts](apps/api/src/main.ts)

The application starts successfully even if critical environment variables like `JWT_SECRET`, `DATABASE_URL`, or `REDIS_HOST` are missing — it only fails at runtime when the service is first used. The JWT strategy does throw if `JWT_SECRET` is missing, but `DATABASE_URL` and Redis config are not validated at startup.

**Recommended fix:**
```typescript
// main.ts — validate required env vars before starting
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_HOST'];
const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}
```

---

### FIND-038 — `.env.example` Exposes MPesa Credential Variable Names and Sandbox Config
**Severity:** LOW  
**File:** [apps/api/.env.example](apps/api/.env.example#L27-L32)

```
MPESA_CONSUMER_KEY=YOUR_SANDBOX_CONSUMER_KEY
MPESA_CONSUMER_SECRET=YOUR_SANDBOX_CONSUMER_SECRET
MPESA_PASSKEY=YOUR_SANDBOX_PASSKEY
MPESA_SHORTCODE=174379
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/webhooks/mpesa/callback
```

The example file reveals the full structure of MPesa integration credentials and the Safaricom sandbox shortcode. This is informational but gives attackers a complete credential map if they obtain access to any environment file.

---

## 11. Vulnerability Severity Matrix

| ID | Finding | Severity | CVSS Estimate | Affected Component | Status |
|----|---------|----------|---------------|-------------------|--------|
| FIND-001 | Insecure random token generation (`Math.random()`) | CRITICAL | 9.1 | auth.service.ts | OPEN |
| FIND-002 | Reset tokens logged in plaintext | CRITICAL | 9.8 | auth.service.ts | OPEN |
| FIND-003 | JWT never invalidated — no logout, no revocation | CRITICAL | 8.8 | auth.module.ts, jwt.strategy.ts | OPEN |
| FIND-004 | Reset tokens stored in in-memory Map (lost on restart) | HIGH | 7.5 | auth.service.ts | OPEN |
| FIND-005 | No rate limiting on any endpoint | HIGH | 8.1 | main.ts, auth.controller.ts | OPEN |
| FIND-006 | No Helmet.js — zero HTTP security headers | HIGH | 7.5 | main.ts | OPEN |
| FIND-007 | Swagger UI exposed in all environments | HIGH | 5.3 | main.ts | OPEN |
| FIND-008 | No max password length (bcrypt DoS vector) | HIGH | 6.5 | auth.dto.ts | OPEN |
| FIND-016 | JWT in localStorage (XSS-accessible) | HIGH | 6.1 | auth.ts (web) | OPEN |
| FIND-022 | No logout endpoint | HIGH | 7.5 | auth.controller.ts | OPEN |
| FIND-029 | No dependency vulnerability scanning in CI | HIGH | 7.0 | ci.yml | OPEN |
| FIND-031 | No HTTPS / TLS enforcement | HIGH | 7.5 | main.ts, infrastructure | OPEN |
| FIND-033 | No production environment protection | HIGH | 8.0 | ci.yml, GitHub settings | OPEN |
| FIND-009 | RolesGuard default-allow (no @Roles decorator) | MEDIUM | 5.4 | roles.guard.ts | OPEN |
| FIND-010 | IDOR: guest can initiate payment on any order | MEDIUM | 6.5 | payments.service.ts | OPEN |
| FIND-011 | No phone number format validation | MEDIUM | 5.3 | auth.dto.ts, initiate-payment.dto.ts | OPEN |
| FIND-012 | No request body size limits | MEDIUM | 5.3 | main.ts | OPEN |
| FIND-013 | No pagination max limit (unbounded queries) | MEDIUM | 5.0 | orders.controller.ts, admin controllers | OPEN |
| FIND-018 | No Content Security Policy on frontend | MEDIUM | 6.1 | next.config.js | OPEN |
| FIND-020 | CORS allows localhost:3001 as origin | MEDIUM | 4.3 | main.ts | OPEN |
| FIND-021 | No global exception filter (stack trace leakage) | MEDIUM | 5.3 | filters/index.ts | OPEN |
| FIND-023 | Redis has no authentication | MEDIUM | 7.5 | docker-compose.local.yml | OPEN |
| FIND-026 | No SSL on database connection | MEDIUM | 6.5 | .env.example | OPEN |
| FIND-027 | PII stored in plaintext | MEDIUM | 6.5 | schema.prisma | OPEN |
| FIND-032 | PostgreSQL exposed on all interfaces | MEDIUM | 7.5 | docker-compose.local.yml | OPEN |
| FIND-037 | No startup validation for required env vars | MEDIUM | 4.3 | main.ts | OPEN |
| FIND-014 | PoD county validation dead code bug | LOW | 3.1 | payments.service.ts | OPEN |
| FIND-015 | idempotencyKey uses Date.now() (collision risk) | LOW | 2.6 | payments.service.ts | OPEN |
| FIND-019 | NEXT_PUBLIC_ variable awareness | LOW | 2.0 | web/.env.example | INFO |
| FIND-024 | enableImplicitConversion type coercion | LOW | 3.5 | main.ts | OPEN |
| FIND-035 | Hardcoded test secrets in CI | LOW | 2.0 | ci.yml | INFO |
| FIND-036 | Weak JWT secret in local .env | HIGH | 7.5 | apps/api/.env | OPEN |
| FIND-038 | .env.example exposes MPesa credential structure | LOW | 2.0 | .env.example | INFO |

**Summary:** 4 Critical | 13 High | 11 Medium | 4 Low | 3 Informational

---

## 12. Security Hardening Checklist

### Authentication & Session Management
- [ ] Replace `Math.random()` with `crypto.randomBytes()` for token generation (FIND-001)
- [ ] Remove console.log of reset tokens (FIND-002)
- [ ] Implement `POST /auth/logout` endpoint (FIND-022)
- [ ] Implement Redis-backed token blacklist OR token revocation via `tokenIssuedBefore` field (FIND-003)
- [ ] Move reset tokens from in-memory Map to Redis with TTL (FIND-004)
- [ ] Fix JWT expiry env var name mismatch (`JWT_EXPIRES_IN` vs `JWT_ACCESS_EXPIRY`) (FIND-003)
- [ ] Add `@MaxLength(128)` to all password fields (FIND-008)
- [ ] Validate phone number format with Kenyan regex (FIND-011)

### API Security
- [ ] Install and configure `@nestjs/throttler` with strict limits on auth routes (FIND-005)
- [ ] Install and configure `helmet` in `main.ts` (FIND-006)
- [ ] Disable Swagger UI in production environment (FIND-007)
- [ ] Implement global exception filter to prevent stack trace leakage (FIND-021)
- [ ] Add request body size limits (50kb for JSON) (FIND-012)
- [ ] Cap all pagination `limit` parameters to a maximum of 100 (FIND-013)
- [ ] Fix IDOR in payment endpoint — validate order ownership for guests (FIND-010)
- [ ] Change RolesGuard to deny-by-default when no roles specified (FIND-009)

### Frontend
- [ ] Migrate JWT from localStorage to HttpOnly cookies (FIND-016)
- [ ] Configure Content Security Policy headers in next.config.js (FIND-018)

### Infrastructure
- [ ] Configure Redis password in all environments (FIND-023)
- [ ] Bind Docker services to localhost only in compose file (FIND-032)
- [ ] Add `pnpm audit --audit-level=high` to CI pipeline (FIND-029)
- [ ] Add Dependabot configuration (FIND-029)
- [ ] Configure SSL for production database connections (FIND-026)
- [ ] Set up TLS termination via reverse proxy before production (FIND-031)
- [ ] Add GitHub environment protection rules for production (FIND-033)
- [ ] Add startup validation for required environment variables (FIND-037)

---

## 13. Required Fixes Before Deployment

The following **must** be resolved before any production deployment. Listed by effort:

### Quick Wins (< 1 hour each)

**1. Fix cryptographically insecure token generation**
```typescript
// apps/api/src/modules/auth/auth.service.ts — replace lines 173-179
import { randomBytes } from 'crypto';
private generateResetToken(): string {
  return randomBytes(32).toString('hex');
}
```

**2. Remove plaintext token logging**
```typescript
// apps/api/src/modules/auth/auth.service.ts — remove lines 140-141
// Replace with:
this.logger.log(`[Auth] Password reset requested for user ID: ${user.id}`);
```

**3. Install Helmet.js**
```bash
pnpm --filter api add helmet
```
```typescript
// apps/api/src/main.ts — line 8 area, before CORS
import helmet from 'helmet';
app.use(helmet());
```

**4. Disable Swagger in production**
```typescript
// apps/api/src/main.ts
if (process.env.NODE_ENV !== 'production') {
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
```

**5. Add MaxLength to password fields**
```typescript
// apps/api/src/modules/auth/dto/auth.dto.ts
@MaxLength(128)  // Add this decorator
@MinLength(8)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { ... })
password!: string;
```

**6. Fix idempotency key**
```typescript
// apps/api/src/modules/payments/payments.service.ts
import { randomUUID } from 'crypto';
idempotencyKey: `POD-${order.id}-${randomUUID()}`,
```

### Medium Effort (1–4 hours each)

**7. Implement rate limiting**
```bash
pnpm --filter api add @nestjs/throttler
```
Configure in `app.module.ts` and apply `@UseGuards(ThrottlerGuard)` to all auth endpoints.

**8. Add logout endpoint and token blacklist**  
Implement `POST /auth/logout` that adds the token JTI to a Redis blacklist with TTL equal to remaining token lifetime. Update `jwt.strategy.ts` to check blacklist on every request.

**9. Migrate reset tokens to Redis**  
Replace the in-memory `passwordResetTokens` Map with Redis `SETEX` calls using 24-hour TTL.

**10. Implement global exception filter**  
Create `apps/api/src/common/filters/http-exception.filter.ts` and register globally in `main.ts`.

**11. Fix IDOR in payment endpoint**  
Add ownership validation for unauthenticated payment requests using email or session ID matching.

**12. Add Redis password and restrict binding**  
Update `docker-compose.local.yml` and BullMQ connection configuration to use `REDIS_PASSWORD`.

**13. Fix JWT expiry configuration**  
Standardize on one env var name and set access token expiry to 15 minutes.

### Pre-Production Blockers

**14. TLS configuration** — Configure TLS termination proxy before production deployment.

**15. Database SSL** — Add `sslmode=require` to production `DATABASE_URL`.

**16. Dependency audit** — Run `pnpm audit` and resolve all HIGH and CRITICAL findings.

**17. GitHub environment protection** — Configure branch protection on `main` and required reviewers for production deployments.

**18. Startup validation** — Validate all required environment variables at application startup with descriptive error messages.

---

## 14. Recommended Improvements Post-MVP

These are genuine security improvements that are appropriate to defer to post-MVP but should be tracked:

1. **Multi-Factor Authentication (MFA)** — Add TOTP or SMS-based MFA for admin accounts and optionally for customers given the financial nature of transactions.

2. **PII Encryption at Rest** — Implement field-level encryption for phone numbers and physical addresses using AES-256-GCM. Store encryption keys in AWS KMS or HashiCorp Vault.

3. **Audit Logging System** — Create a dedicated `AuditLog` Prisma model to capture security events: login attempts (success/failure), password resets, role changes, payment operations, admin actions. Currently only order status and inventory changes are logged.

4. **Account Lockout Policy** — After N failed login attempts, temporarily lock the account and notify the user by email.

5. **Suspicious Activity Detection** — Detect and alert on: logins from new geographic locations, multiple failed attempts from the same IP, bulk order cancellations, and unusual cart sizes.

6. **CSRF Tokens for State-Changing Operations** — While stateless JWT auth provides some protection, CSRF tokens on checkout and payment initiation provide defense-in-depth especially if token storage moves to cookies.

7. **Sub-Resource Integrity (SRI)** — If any external CDN resources are used, add SRI hashes to `<script>` and `<link>` tags.

8. **Secret Rotation Automation** — Implement automated JWT secret rotation (dual-key acceptance during transition window) and database credential rotation.

9. **Security Information and Event Management (SIEM)** — Integrate with a SIEM or security monitoring platform for real-time alerting on security events.

10. **Kenya Data Protection Act (KDPA) 2019 Compliance** — Formally assess compliance requirements: data retention limits, user data deletion (right to be forgotten), data processing agreements with third parties, privacy policy enforcement.

11. **WebSocket Security** — If real-time order tracking is added, ensure WebSocket connections are authenticated and rate-limited.

12. **Payment Callback Webhook Security** — When real MPesa integration is implemented, the callback webhook (`/webhooks/mpesa/callback`) must validate the request signature from Safaricom to prevent fake payment confirmations.

---

## 15. Final Security Verdict

### NOT SECURE FOR PRODUCTION DEPLOYMENT

**Technical Justification:**

This assessment identifies **4 Critical** and **13 High** severity vulnerabilities that represent unacceptable risk for a production financial application:

1. **Active Account Takeover Vector (CRITICAL):** The combination of FIND-001 (cryptographically weak reset tokens) + FIND-002 (tokens logged in plaintext) creates a direct, exploitable path to full account compromise for any user who initiates a password reset. Any log reader — a system administrator, a CI job, a log aggregation service — can trivially extract and use these tokens.

2. **Stolen Tokens Cannot Be Revoked (CRITICAL):** FIND-003 means that if a customer's token is stolen (via XSS, network sniffing before HTTPS, or localStorage access), there is no mechanism to invalidate it. The token works for up to 7 days (due to env var misconfiguration). Combined with FIND-016 (localStorage storage), stolen tokens are a realistic attack scenario.

3. **No Brute Force Protection (HIGH):** FIND-005 allows unlimited automated attacks against the login endpoint. A customer account with a weak password can be compromised within minutes. This is unacceptable for a platform handling payment operations.

4. **No HTTP Security Headers (HIGH):** FIND-006 means every response lacks basic browser security protections. Clickjacking attacks against the admin dashboard, MIME sniffing attacks, and absence of HSTS are all exploitable in the absence of Helmet.js.

5. **API Fully Documented and Interactive in Production (HIGH):** FIND-007 means an attacker visiting `/api/docs` gets a complete, interactive attack surface map including all endpoints, parameters, and schemas.

### Conditional Path to Deployment

The application can achieve **DEPLOYABLE WITH MINOR SECURITY FIXES** status after resolving items **1–13** from Section 13 (Required Fixes). The estimated effort for a competent engineer is **2–3 focused days**. The core architecture is sound: Prisma ORM prevents SQL injection, bcrypt is used for password hashing, role guards are structurally correct, and transaction handling is properly implemented.

The vulnerabilities are concentrated in: missing middleware (Helmet, throttler), insecure token generation, and missing infrastructure controls — all of which are well-understood, fixable problems with established solutions.

**Minimum bar for production deployment:**
- All 4 Critical findings resolved
- All 13 High findings resolved  
- At minimum: Redis password, database SSL, TLS termination

After those fixes: **DEPLOYABLE WITH MINOR SECURITY FIXES**

---

*End of Security Audit Report*  
*This document should be treated as sensitive — it contains detailed vulnerability information.*
