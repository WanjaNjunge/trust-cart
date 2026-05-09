# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.spec.ts >> API: Admin access control >> GET /admin/inventory — accessible to ADMIN
- Location: e2e\api.spec.ts:143:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 500
```

# Test source

```ts
  47  |   // FIX 2b: The count field is `totalItems`, not `total`.
  48  |   test('GET /products — returns paginated list with pagination object', async ({ request }) => {
  49  |     const res = await request.get(`${API}/products`);
  50  |     expect(res.status()).toBe(200);
  51  |     const body = await res.json();
  52  |     expect(Array.isArray(body.data)).toBe(true);
  53  |     expect(body.data.length).toBeGreaterThan(0);
  54  |     expect(body).toHaveProperty('pagination');
  55  |     expect(typeof body.pagination.totalItems).toBe('number');
  56  |   });
  57  | 
  58  |   // FIX 3: The product API serialises inventory as computed fields (isInStock,
  59  |   // availableQuantity), not the raw Prisma inventoryRecord relation object.
  60  |   test('GET /products/slug/:slug — returns product with stock info', async ({ request }) => {
  61  |     const res = await request.get(`${API}/products/slug/${SLUGS.product}`);
  62  |     expect(res.status()).toBe(200);
  63  |     const body = await res.json();
  64  |     expect(body.slug).toBe(SLUGS.product);
  65  |     expect(typeof body.price).toBe('number');
  66  |     expect(body).toHaveProperty('isInStock');
  67  |     expect(body).toHaveProperty('availableQuantity');
  68  |     expect(typeof body.availableQuantity).toBe('number');
  69  |   });
  70  | 
  71  |   test('GET /products/slug/nonexistent — returns 404', async ({ request }) => {
  72  |     const res = await request.get(`${API}/products/slug/this-does-not-exist-xyz`);
  73  |     expect(res.status()).toBe(404);
  74  |   });
  75  | 
  76  |   // FIX 4: The search query param is `q`, not `search`.
  77  |   // The global ValidationPipe has forbidNonWhitelisted: true — unknown params cause 400.
  78  |   test('GET /products?q=laptop — filters results by search term', async ({ request }) => {
  79  |     const res = await request.get(`${API}/products?q=laptop`);
  80  |     expect(res.status()).toBe(200);
  81  |     const body = await res.json();
  82  |     expect(Array.isArray(body.data)).toBe(true);
  83  |     expect(body.data.length).toBeGreaterThan(0);
  84  |   });
  85  | });
  86  | 
  87  | // ─── Cart ─────────────────────────────────────────────────────────────────────
  88  | 
  89  | test.describe('API: Cart', () => {
  90  |   let token: string;
  91  | 
  92  |   test.beforeAll(async () => {
  93  |     // Use the shared loginViaApi helper (Node.js fetch) — same pattern as all other spec files
  94  |     const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
  95  |     token = auth.token;
  96  |   });
  97  | 
  98  |   test('GET /cart — authenticated request returns cart with items array', async ({ request }) => {
  99  |     const res = await request.get(`${API}/cart`, {
  100 |       headers: { Authorization: `Bearer ${token}` },
  101 |     });
  102 |     expect(res.status()).toBe(200);
  103 |     const body = await res.json();
  104 |     expect(Array.isArray(body.items)).toBe(true);
  105 |   });
  106 | 
  107 |   // FIX 5: Cart uses OptionalJwtAuthGuard — unauthenticated requests are allowed
  108 |   // and return a guest cart (200), not 401. The cart is guest-friendly by design.
  109 |   // To test a hard 401, use an endpoint with JwtAuthGuard, e.g. GET /orders or GET /users/me.
  110 |   test('GET /cart — unauthenticated request returns guest cart (200)', async ({ request }) => {
  111 |     const res = await request.get(`${API}/cart`);
  112 |     expect(res.status()).toBe(200);
  113 |     const body = await res.json();
  114 |     expect(Array.isArray(body.items)).toBe(true);
  115 |   });
  116 | 
  117 |   test('GET /users/me — returns 401 without token (strict auth guard)', async ({ request }) => {
  118 |     const res = await request.get(`${API}/users/me`);
  119 |     expect(res.status()).toBe(401);
  120 |   });
  121 | });
  122 | 
  123 | // ─── Admin role-based access ──────────────────────────────────────────────────
  124 | 
  125 | test.describe('API: Admin access control', () => {
  126 |   let adminToken: string;
  127 |   let customerToken: string;
  128 | 
  129 |   // FIX 6: Use loginViaApi (Node.js fetch) instead of the Playwright request fixture.
  130 |   // The request fixture in beforeAll creates a separate APIRequestContext from the one
  131 |   // in individual tests. Tokens obtained via the fixture's session may behave differently
  132 |   // when passed to a different request context. Using the shared Node.js fetch helper
  133 |   // (proven across all other spec files) eliminates this scoping ambiguity entirely.
  134 |   test.beforeAll(async () => {
  135 |     const [adminAuth, customerAuth] = await Promise.all([
  136 |       loginViaApi(USERS.admin.email, USERS.admin.password),
  137 |       loginViaApi(USERS.customer.email, USERS.customer.password),
  138 |     ]);
  139 |     adminToken = adminAuth.token;
  140 |     customerToken = customerAuth.token;
  141 |   });
  142 | 
  143 |   test('GET /admin/inventory — accessible to ADMIN', async ({ request }) => {
  144 |     const res = await request.get(`${API}/admin/inventory`, {
  145 |       headers: { Authorization: `Bearer ${adminToken}` },
  146 |     });
> 147 |     expect(res.status()).toBe(200);
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  148 |   });
  149 | 
  150 |   test('GET /admin/inventory — returns 403 for CUSTOMER', async ({ request }) => {
  151 |     const res = await request.get(`${API}/admin/inventory`, {
  152 |       headers: { Authorization: `Bearer ${customerToken}` },
  153 |     });
  154 |     expect(res.status()).toBe(403);
  155 |   });
  156 | 
  157 |   test('GET /admin/orders — returns 401 without token', async ({ request }) => {
  158 |     const res = await request.get(`${API}/admin/orders`);
  159 |     expect(res.status()).toBe(401);
  160 |   });
  161 | 
  162 |   test('GET /admin/orders — accessible to ADMIN', async ({ request }) => {
  163 |     const res = await request.get(`${API}/admin/orders`, {
  164 |       headers: { Authorization: `Bearer ${adminToken}` },
  165 |     });
  166 |     expect(res.status()).toBe(200);
  167 |   });
  168 | });
  169 | 
```