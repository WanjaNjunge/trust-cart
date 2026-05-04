# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: order-management.spec.ts >> Order Management (Customer) >> order detail page shows items, address, and status timeline
- Location: e2e\order-management.spec.ts:42:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('TC-2026-000022')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('TC-2026-000022')

```

# Page snapshot

```yaml
- dialog "Unhandled Runtime Error" [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - navigation [ref=e7]:
          - button "previous" [disabled] [ref=e8]:
            - img "previous" [ref=e9]
          - button "next" [disabled] [ref=e11]:
            - img "next" [ref=e12]
          - generic [ref=e14]: 1 of 1 error
          - generic [ref=e15]:
            - text: Next.js (14.2.35) is outdated
            - link "(learn more)" [ref=e17] [cursor=pointer]:
              - /url: https://nextjs.org/docs/messages/version-staleness
        - button "Close" [ref=e18] [cursor=pointer]:
          - img [ref=e20]
      - heading "Unhandled Runtime Error" [level=1] [ref=e23]
      - paragraph [ref=e24]: "Error: An unsupported type was passed to use(): [object Object]"
    - generic [ref=e25]:
      - heading "Source" [level=2] [ref=e26]
      - generic [ref=e27]:
        - link "src\\app\\orders\\[id]\\page.tsx (159:32) @ params" [ref=e29] [cursor=pointer]:
          - generic [ref=e30]: src\app\orders\[id]\page.tsx (159:32) @ params
          - img [ref=e31]
        - generic [ref=e35]: "157 | 158 | export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) { > 159 | const resolvedParams = use(params); | ^ 160 | const [order, setOrder] = useState<Order | null>(null); 161 | const [loading, setLoading] = useState(true); 162 | const [error, setError] = useState<string | null>(null);"
      - heading "Call Stack" [level=2] [ref=e36]
      - button "Show collapsed frames" [ref=e37] [cursor=pointer]
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
  38  |     await expect(page.getByText(/your orders/i)).toBeVisible({ timeout: 10_000 });
  39  |     await expect(page.getByText(confirmedOrderNumber)).toBeVisible({ timeout: 10_000 });
  40  |   });
  41  | 
  42  |   test('order detail page shows items, address, and status timeline', async ({ page }) => {
  43  |     await page.goto(`/orders/${confirmedOrderId}`);
> 44  |     await expect(page.getByText(confirmedOrderNumber)).toBeVisible({ timeout: 10_000 });
      |                                                        ^ Error: expect(locator).toBeVisible() failed
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