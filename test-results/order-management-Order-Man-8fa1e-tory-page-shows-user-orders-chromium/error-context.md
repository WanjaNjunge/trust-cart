# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: order-management.spec.ts >> Order Management (Customer) >> order history page shows user orders
- Location: e2e\order-management.spec.ts:36:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/your orders/i)
Expected: visible
Error: strict mode violation: getByText(/your orders/i) resolved to 2 elements:
    1) <h1 class="text-3xl font-bold text-gray-900">Your Orders</h1> aka getByRole('heading', { name: 'Your Orders' })
    2) <p class="mt-2 text-gray-600">Track and manage your orders</p> aka getByText('Track and manage your orders')

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/your orders/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "TrustCart" [ref=e4] [cursor=pointer]:
        - /url: /
        - generic [ref=e5]: TrustCart
      - generic [ref=e7]:
        - textbox "Search for laptops, phones, or accessories..." [ref=e8]
        - img [ref=e9]
      - generic [ref=e12]:
        - generic [ref=e13]:
          - link "Orders" [ref=e14] [cursor=pointer]:
            - /url: /orders
          - generic [ref=e15]:
            - link "John" [ref=e16] [cursor=pointer]:
              - /url: /account
            - button "Logout" [ref=e17] [cursor=pointer]
        - link "Cart" [ref=e18] [cursor=pointer]:
          - /url: /cart
          - img [ref=e20]
          - generic [ref=e23]: Cart
  - main [ref=e24]:
    - generic [ref=e27]:
      - generic [ref=e28]:
        - heading "Your Orders" [level=1] [ref=e29]
        - paragraph [ref=e30]: Track and manage your orders
      - generic [ref=e31]:
        - link "TC-2026-000021 Pending Payment 4 May 2026 • 1 item Ksh 65,990 MPESA STK HP EliteBook 840 G6 × 1" [ref=e32] [cursor=pointer]:
          - /url: /orders/cmoqtgp07001mnc9mgmr3wmj4
          - generic [ref=e33]:
            - generic [ref=e34]:
              - generic [ref=e35]:
                - generic [ref=e36]:
                  - heading "TC-2026-000021" [level=3] [ref=e37]
                  - generic [ref=e38]: Pending Payment
                - paragraph [ref=e39]: 4 May 2026 • 1 item
              - generic [ref=e40]:
                - paragraph [ref=e41]: Ksh 65,990
                - paragraph [ref=e42]: MPESA STK
            - generic [ref=e45]: HP EliteBook 840 G6 × 1
        - link "TC-2026-000020 Confirmed 4 May 2026 • 1 item Ksh 65,990 MPESA STK HP EliteBook 840 G6 × 1" [ref=e46] [cursor=pointer]:
          - /url: /orders/cmoqtf6wy000jnc9mmmkr2wfq
          - generic [ref=e47]:
            - generic [ref=e48]:
              - generic [ref=e49]:
                - generic [ref=e50]:
                  - heading "TC-2026-000020" [level=3] [ref=e51]
                  - generic [ref=e52]: Confirmed
                - paragraph [ref=e53]: 4 May 2026 • 1 item
              - generic [ref=e54]:
                - paragraph [ref=e55]: Ksh 65,990
                - paragraph [ref=e56]: MPESA STK
            - generic [ref=e59]: HP EliteBook 840 G6 × 1
        - link "TC-2026-000019 Confirmed 2 May 2026 • 1 item Ksh 65,990 MPESA STK HP EliteBook 840 G6 × 1" [ref=e60] [cursor=pointer]:
          - /url: /orders/cmood9xe7009f14nvdy0a5fx2
          - generic [ref=e61]:
            - generic [ref=e62]:
              - generic [ref=e63]:
                - generic [ref=e64]:
                  - heading "TC-2026-000019" [level=3] [ref=e65]
                  - generic [ref=e66]: Confirmed
                - paragraph [ref=e67]: 2 May 2026 • 1 item
              - generic [ref=e68]:
                - paragraph [ref=e69]: Ksh 65,990
                - paragraph [ref=e70]: MPESA STK
            - generic [ref=e73]: HP EliteBook 840 G6 × 1
        - link "TC-2026-000018 Pending Payment 2 May 2026 • 1 item Ksh 55,990 MPESA STK Lenovo ThinkPad T480 × 1" [ref=e74] [cursor=pointer]:
          - /url: /orders/cmood8zf8008h14nvbkltil85
          - generic [ref=e75]:
            - generic [ref=e76]:
              - generic [ref=e77]:
                - generic [ref=e78]:
                  - heading "TC-2026-000018" [level=3] [ref=e79]
                  - generic [ref=e80]: Pending Payment
                - paragraph [ref=e81]: 2 May 2026 • 1 item
              - generic [ref=e82]:
                - paragraph [ref=e83]: Ksh 55,990
                - paragraph [ref=e84]: MPESA STK
            - generic [ref=e87]: Lenovo ThinkPad T480 × 1
        - link "TC-2026-000017 Pending Payment 2 May 2026 • 1 item Ksh 65,990 MPESA STK HP EliteBook 840 G6 × 1" [ref=e88] [cursor=pointer]:
          - /url: /orders/cmood8xxl008314nvm2mj6pv6
          - generic [ref=e89]:
            - generic [ref=e90]:
              - generic [ref=e91]:
                - generic [ref=e92]:
                  - heading "TC-2026-000017" [level=3] [ref=e93]
                  - generic [ref=e94]: Pending Payment
                - paragraph [ref=e95]: 2 May 2026 • 1 item
              - generic [ref=e96]:
                - paragraph [ref=e97]: Ksh 65,990
                - paragraph [ref=e98]: MPESA STK
            - generic [ref=e101]: HP EliteBook 840 G6 × 1
        - link "TC-2026-000016 Pending Payment 2 May 2026 • 1 item Ksh 65,990 MPESA STK HP EliteBook 840 G6 × 1" [ref=e102] [cursor=pointer]:
          - /url: /orders/cmood8m3e007p14nvthv9o0l3
          - generic [ref=e103]:
            - generic [ref=e104]:
              - generic [ref=e105]:
                - generic [ref=e106]:
                  - heading "TC-2026-000016" [level=3] [ref=e107]
                  - generic [ref=e108]: Pending Payment
                - paragraph [ref=e109]: 2 May 2026 • 1 item
              - generic [ref=e110]:
                - paragraph [ref=e111]: Ksh 65,990
                - paragraph [ref=e112]: MPESA STK
            - generic [ref=e115]: HP EliteBook 840 G6 × 1
        - link "TC-2026-000015 Pending Payment 2 May 2026 • 1 item Ksh 65,990 MPESA STK HP EliteBook 840 G6 × 1" [ref=e116] [cursor=pointer]:
          - /url: /orders/cmood8bqw007a14nv8n7imqhm
          - generic [ref=e117]:
            - generic [ref=e118]:
              - generic [ref=e119]:
                - generic [ref=e120]:
                  - heading "TC-2026-000015" [level=3] [ref=e121]
                  - generic [ref=e122]: Pending Payment
                - paragraph [ref=e123]: 2 May 2026 • 1 item
              - generic [ref=e124]:
                - paragraph [ref=e125]: Ksh 65,990
                - paragraph [ref=e126]: MPESA STK
            - generic [ref=e129]: HP EliteBook 840 G6 × 1
        - link "TC-2026-000014 Pending Payment 2 May 2026 • 1 item Ksh 65,990 MPESA STK HP EliteBook 840 G6 × 1" [ref=e130] [cursor=pointer]:
          - /url: /orders/cmood7yo9006w14nvwsuheu5h
          - generic [ref=e131]:
            - generic [ref=e132]:
              - generic [ref=e133]:
                - generic [ref=e134]:
                  - heading "TC-2026-000014" [level=3] [ref=e135]
                  - generic [ref=e136]: Pending Payment
                - paragraph [ref=e137]: 2 May 2026 • 1 item
              - generic [ref=e138]:
                - paragraph [ref=e139]: Ksh 65,990
                - paragraph [ref=e140]: MPESA STK
            - generic [ref=e143]: HP EliteBook 840 G6 × 1
        - link "TC-2026-000013 Pending Payment 2 May 2026 • 1 item Ksh 65,990 MPESA STK HP EliteBook 840 G6 × 1" [ref=e144] [cursor=pointer]:
          - /url: /orders/cmood7sb9006i14nvdeqme9uy
          - generic [ref=e145]:
            - generic [ref=e146]:
              - generic [ref=e147]:
                - generic [ref=e148]:
                  - heading "TC-2026-000013" [level=3] [ref=e149]
                  - generic [ref=e150]: Pending Payment
                - paragraph [ref=e151]: 2 May 2026 • 1 item
              - generic [ref=e152]:
                - paragraph [ref=e153]: Ksh 65,990
                - paragraph [ref=e154]: MPESA STK
            - generic [ref=e157]: HP EliteBook 840 G6 × 1
        - link "TC-2026-000012 Confirmed 2 May 2026 • 1 item Ksh 65,990 MPESA STK HP EliteBook 840 G6 × 1" [ref=e158] [cursor=pointer]:
          - /url: /orders/cmood65q7005h14nv1nppvbr3
          - generic [ref=e159]:
            - generic [ref=e160]:
              - generic [ref=e161]:
                - generic [ref=e162]:
                  - heading "TC-2026-000012" [level=3] [ref=e163]
                  - generic [ref=e164]: Confirmed
                - paragraph [ref=e165]: 2 May 2026 • 1 item
              - generic [ref=e166]:
                - paragraph [ref=e167]: Ksh 65,990
                - paragraph [ref=e168]: MPESA STK
            - generic [ref=e171]: HP EliteBook 840 G6 × 1
        - generic [ref=e172]:
          - button "Previous" [disabled] [ref=e173]
          - generic [ref=e174]: Page 1 of 2
          - button "Next" [ref=e175] [cursor=pointer]
  - contentinfo [ref=e176]:
    - generic [ref=e177]:
      - generic [ref=e178]:
        - generic [ref=e179]:
          - link "TrustCart Kenya" [ref=e180] [cursor=pointer]:
            - /url: /
          - paragraph [ref=e181]: Electronics you can trust. Authentic products, secure payments, and reliable delivery across Kenya.
        - generic [ref=e182]:
          - heading "Shop" [level=3] [ref=e183]
          - list [ref=e184]:
            - listitem [ref=e185]:
              - link "Laptops" [ref=e186] [cursor=pointer]:
                - /url: /categories/laptops
            - listitem [ref=e187]:
              - link "Phones" [ref=e188] [cursor=pointer]:
                - /url: /categories/phones
            - listitem [ref=e189]:
              - link "Tablets" [ref=e190] [cursor=pointer]:
                - /url: /categories/tablets
            - listitem [ref=e191]:
              - link "Accessories" [ref=e192] [cursor=pointer]:
                - /url: /categories/accessories
        - generic [ref=e193]:
          - heading "Company" [level=3] [ref=e194]
          - list [ref=e195]:
            - listitem [ref=e196]:
              - link "About Us" [ref=e197] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e198]:
              - link "Contact" [ref=e199] [cursor=pointer]:
                - /url: /contact
            - listitem [ref=e200]:
              - link "Terms of Service" [ref=e201] [cursor=pointer]:
                - /url: /terms
            - listitem [ref=e202]:
              - link "Privacy Policy" [ref=e203] [cursor=pointer]:
                - /url: /privacy
        - generic [ref=e204]:
          - heading "Contact" [level=3] [ref=e205]
          - list [ref=e206]:
            - listitem [ref=e207]:
              - img [ref=e208]
              - text: +254 700 000 000
            - listitem [ref=e210]:
              - img [ref=e211]
              - text: support@trustcart.co.ke
            - listitem [ref=e213]:
              - img [ref=e214]
              - text: Nairobi, Kenya
      - generic [ref=e218]:
        - paragraph [ref=e219]: © 2026 TrustCart Kenya. All rights reserved.
        - generic [ref=e220]:
          - generic [ref=e221]: Secure payments with
          - generic [ref=e222]: M-PESA
  - alert [ref=e223]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { USERS } from './fixtures/users';
  3   | import { loginViaApi, setAuthInBrowser } from './helpers/auth';
  4   | import { getUserAddresses, createOrder, clearCart } from './helpers/api';
  5   | 
  6   | let confirmedOrderId: string;
  7   | let confirmedOrderNumber: string;
  8   | 
  9   | test.describe('Order Management (Customer)', () => {
  10  |   test.beforeAll(async () => {
  11  |     const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
  12  |     const addresses = await getUserAddresses(auth.token);
  13  |     const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  14  |     if (!defaultAddress) throw new Error('Customer has no seeded address — run pnpm db:seed');
  15  | 
  16  |     await clearCart(auth.token);
  17  |     const product = await fetch(
  18  |       'http://localhost:3001/api/v1/products/slug/hp-elitebook-840-g6',
  19  |     ).then((r) => r.json()) as { id: string };
  20  |     await fetch('http://localhost:3001/api/v1/cart/items', {
  21  |       method: 'POST',
  22  |       headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
  23  |       body: JSON.stringify({ productId: product.id, quantity: 1 }),
  24  |     });
  25  | 
  26  |     const order = await createOrder(auth.token, defaultAddress.id);
  27  |     confirmedOrderId = order.id;
  28  |     confirmedOrderNumber = order.orderNumber;
  29  |   });
  30  | 
  31  |   test.beforeEach(async ({ page }) => {
  32  |     const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
  33  |     await setAuthInBrowser(page, auth);
  34  |   });
  35  | 
  36  |   test('order history page shows user orders', async ({ page }) => {
  37  |     await page.goto('/orders');
> 38  |     await expect(page.getByText(/your orders/i)).toBeVisible({ timeout: 10_000 });
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  39  |     await expect(page.getByText(confirmedOrderNumber)).toBeVisible({ timeout: 10_000 });
  40  |   });
  41  | 
  42  |   test('order detail page shows items, address, and status timeline', async ({ page }) => {
  43  |     await page.goto(`/orders/${confirmedOrderId}`);
  44  |     await expect(page.getByText(confirmedOrderNumber)).toBeVisible({ timeout: 10_000 });
  45  |     await expect(page.getByText(/HP EliteBook|item/i)).toBeVisible();
  46  |     await expect(page.getByText(/Pending Payment|PENDING_PAYMENT/i)).toBeVisible();
  47  |   });
  48  | 
  49  |   test('unauthenticated access to orders shows login prompt', async ({ page }) => {
  50  |     // Orders page uses a LoginPrompt component — it stays at /orders (no redirect)
  51  |     await page.evaluate(() => localStorage.clear());
  52  |     await page.goto('/orders');
  53  |     // The LoginPrompt renders on the same URL — not a router redirect
  54  |     await expect(page.getByRole('link', { name: /sign in|log in|login/i }).first()).toBeVisible({
  55  |       timeout: 8_000,
  56  |     });
  57  |   });
  58  | 
  59  |   test('order detail shows cancel button for PENDING_PAYMENT orders', async ({ page }) => {
  60  |     await page.goto(`/orders/${confirmedOrderId}`);
  61  |     await expect(page.getByText(confirmedOrderNumber)).toBeVisible({ timeout: 10_000 });
  62  |     // The cancel button opens a CancelOrderModal
  63  |     const cancelBtn = page.getByRole('button', { name: /cancel order/i });
  64  |     await expect(cancelBtn).toBeVisible({ timeout: 10_000 });
  65  |   });
  66  | 
  67  |   test('cancel order changes status to CANCELLED', async ({ page }) => {
  68  |     const auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
  69  |     const addresses = await getUserAddresses(auth.token);
  70  |     const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  71  | 
  72  |     await clearCart(auth.token);
  73  |     const product = await fetch(
  74  |       'http://localhost:3001/api/v1/products/slug/lenovo-thinkpad-t480',
  75  |     ).then((r) => r.json()) as { id: string };
  76  |     await fetch('http://localhost:3001/api/v1/cart/items', {
  77  |       method: 'POST',
  78  |       headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
  79  |       body: JSON.stringify({ productId: product.id, quantity: 1 }),
  80  |     });
  81  | 
  82  |     const cancelTarget = await createOrder(auth.token, defaultAddress!.id);
  83  | 
  84  |     await setAuthInBrowser(page, auth);
  85  |     await page.goto(`/orders/${cancelTarget.id}`);
  86  | 
  87  |     // Click "Cancel Order" to open the CancelOrderModal
  88  |     const cancelBtn = page.getByRole('button', { name: /cancel order/i });
  89  |     await expect(cancelBtn).toBeVisible({ timeout: 10_000 });
  90  |     await cancelBtn.click();
  91  | 
  92  |     // Modal confirm button says "Yes, Cancel Order"
  93  |     const confirmBtn = page.getByRole('button', { name: /yes.*cancel|yes, cancel order/i });
  94  |     await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
  95  |     await confirmBtn.click();
  96  | 
  97  |     await expect(page.getByText(/cancelled/i)).toBeVisible({ timeout: 10_000 });
  98  |   });
  99  | });
  100 | 
```