# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shopping-flow.spec.ts >> Shopping Flow >> full checkout flow: add to cart → checkout → order confirmation
- Location: e2e\shopping-flow.spec.ts:78:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /order placed successfully/i })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('heading', { name: /order placed successfully/i })

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
        - link "src\\app\\order-confirmation\\[id]\\page.tsx (21:22) @ params" [ref=e29] [cursor=pointer]:
          - generic [ref=e30]: src\app\order-confirmation\[id]\page.tsx (21:22) @ params
          - img [ref=e31]
        - generic [ref=e35]: "19 | 20 | export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) { > 21 | const { id } = use(params); | ^ 22 | const router = useRouter(); 23 | 24 | const [order, setOrder] = useState<Order | null>(null);"
      - heading "Call Stack" [level=2] [ref=e36]
      - button "Show collapsed frames" [ref=e37] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { USERS, SLUGS } from './fixtures/users';
  3   | import { loginViaApi, setAuthInBrowser } from './helpers/auth';
  4   | import { clearCart } from './helpers/api';
  5   | 
  6   | const API = 'http://localhost:3001/api/v1';
  7   | 
  8   | async function addToCartViaApi(token: string, slug: string) {
  9   |   const product = await fetch(`${API}/products/slug/${slug}`).then((r) => r.json()) as { id: string };
  10  |   await fetch(`${API}/cart/items`, {
  11  |     method: 'POST',
  12  |     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  13  |     body: JSON.stringify({ productId: product.id, quantity: 1 }),
  14  |   });
  15  |   return product;
  16  | }
  17  | 
  18  | test.describe('Shopping Flow', () => {
  19  |   let auth: { token: string; user: { id: string; email: string; role: string; firstName: string; lastName: string } };
  20  | 
  21  |   test.beforeEach(async ({ page }) => {
  22  |     auth = await loginViaApi(USERS.customer.email, USERS.customer.password);
  23  |     // Clear cart before each test so tests don't interfere with each other
  24  |     await clearCart(auth.token);
  25  |     await setAuthInBrowser(page, auth);
  26  |   });
  27  | 
  28  |   test('add product to cart updates header cart count', async ({ page }) => {
  29  |     await page.goto(`/products/${SLUGS.product}`);
  30  |     // The button text is "Add to cart" (lowercase c)
  31  |     await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible({ timeout: 10_000 });
  32  |     await page.getByRole('button', { name: /add to cart/i }).click();
  33  |     // ProductActions shows a success state after adding
  34  |     await expect(page.getByText(/added|success|added to cart/i).first()).toBeVisible({ timeout: 8_000 });
  35  |   });
  36  | 
  37  |   test('cart page shows added items with prices', async ({ page }) => {
  38  |     await addToCartViaApi(auth.token, SLUGS.product);
  39  |     await page.goto('/cart');
  40  |     await expect(page.getByText(/HP EliteBook|hp elitebook/i)).toBeVisible({ timeout: 10_000 });
  41  |     await expect(page.getByText(/KES|KSh/i).first()).toBeVisible();
  42  |     await expect(page.getByRole('link', { name: /proceed to checkout/i })).toBeVisible();
  43  |   });
  44  | 
  45  |   test('removing item from cart updates total', async ({ page }) => {
  46  |     await addToCartViaApi(auth.token, SLUGS.product);
  47  |     await page.goto('/cart');
  48  | 
  49  |     // Confirm the item is present first
  50  |     await expect(page.getByText(/HP EliteBook|hp elitebook/i)).toBeVisible({ timeout: 10_000 });
  51  | 
  52  |     // Click the Remove button — this opens a ConfirmModal (confirmLabel="Remove", variant="danger")
  53  |     const removeBtn = page.getByRole('button', { name: /remove/i }).first();
  54  |     await removeBtn.click();
  55  | 
  56  |     // The modal dialog renders with a second "Remove" confirm button inside it
  57  |     const modal = page.locator('[role="dialog"]');
  58  |     await expect(modal).toBeVisible({ timeout: 5_000 });
  59  |     await modal.getByRole('button', { name: /remove/i }).click();
  60  | 
  61  |     // Item should now be gone from the cart
  62  |     await expect(page.getByText(/HP EliteBook|hp elitebook/i)).not.toBeVisible({ timeout: 8_000 });
  63  |   });
  64  | 
  65  |   test('applying invalid promo code shows error', async ({ page }) => {
  66  |     await addToCartViaApi(auth.token, SLUGS.product);
  67  |     await page.goto('/cart');
  68  | 
  69  |     // Promo code input has placeholder "Promo code"
  70  |     const promoInput = page.locator('input[placeholder="Promo code"]');
  71  |     await expect(promoInput).toBeVisible({ timeout: 10_000 });
  72  |     await promoInput.fill('INVALIDCODE999');
  73  |     await page.getByRole('button', { name: /apply/i }).click();
  74  |     await expect(page.getByText(/invalid|not found|expired|error/i)).toBeVisible({ timeout: 8_000 });
  75  |   });
  76  | 
  77  |   // Full checkout — MPesa stub auto-confirms after 5 s; polling detects within 36 s
  78  |   test('full checkout flow: add to cart → checkout → order confirmation', async ({ page }) => {
  79  |     test.setTimeout(90_000);
  80  | 
  81  |     await addToCartViaApi(auth.token, SLUGS.product);
  82  |     await page.goto('/cart');
  83  | 
  84  |     await page.getByRole('link', { name: /proceed to checkout/i }).click();
  85  |     await expect(page).toHaveURL(/checkout/, { timeout: 10_000 });
  86  | 
  87  |     // Address is auto-selected (john.doe has a seeded Nairobi address)
  88  |     // MPesa STK is default payment method
  89  |     const placeOrderBtn = page.getByRole('button', { name: /place order/i });
  90  |     await expect(placeOrderBtn).toBeVisible({ timeout: 10_000 });
  91  |     await placeOrderBtn.click();
  92  | 
  93  |     // Wait for polling to detect CONFIRMED and redirect to confirmation page
  94  |     await expect(page).toHaveURL(/order-confirmation/, { timeout: 60_000 });
  95  | 
  96  |     // Confirmation page heading is always "Order Placed Successfully!"
  97  |     await expect(
  98  |       page.getByRole('heading', { name: /order placed successfully/i }),
> 99  |     ).toBeVisible({ timeout: 15_000 });
      |       ^ Error: expect(locator).toBeVisible() failed
  100 |     await expect(page.getByRole('link', { name: /view order/i })).toBeVisible();
  101 |     await expect(page.getByRole('link', { name: /continue shopping/i })).toBeVisible();
  102 |   });
  103 | });
  104 | 
```