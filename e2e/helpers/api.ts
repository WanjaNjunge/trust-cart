/**
 * API Helper — centralised HTTP client for all test suite API calls.
 * Wraps fetch with auth headers, JSON handling, and descriptive error messages.
 * All other helpers and fixtures call through here — never fetch directly in tests.
 */

const API = 'http://localhost:3001/api/v1';

interface LoginResponse {
  accessToken: string;
  user: { id: string; email: string; role: string; firstName: string; lastName: string };
}

export async function apiRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(err)}`);
  }
  return res.json();
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('POST', '/auth/login', { email, password });
}

export async function getFirstProduct(token?: string) {
  const data = await apiRequest<{ data: Array<{ id: string; slug: string; name: string }> }>(
    'GET',
    '/products?limit=1&isActive=true',
    undefined,
    token,
  );
  return data.data[0];
}

export async function getProductBySlug(
  slug: string,
  token?: string,
): Promise<{ id: string; slug: string; name: string }> {
  return apiRequest('GET', `/products/slug/${slug}`, undefined, token);
}

export async function createOrder(
  token: string,
  addressId: string,
  sessionId?: string,
): Promise<{ id: string; orderNumber: string; status: string; total: number }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (sessionId) headers['X-Session-ID'] = sessionId;

  const res = await fetch(`${API}/checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ addressId, paymentMethod: 'MPESA_STK' }),
  });
  if (!res.ok) throw new Error(`Checkout failed: ${await res.text()}`);
  return res.json();
}

export async function initiatePaymentApi(
  orderId: string,
  token: string,
): Promise<{ status: string; transactionId: string }> {
  return apiRequest('POST', '/payments/initiate', { orderId }, token);
}

export async function getUserAddresses(token: string): Promise<Array<{ id: string; isDefault: boolean }>> {
  return apiRequest('GET', '/users/me/addresses', undefined, token);
}

export async function clearCart(token: string): Promise<void> {
  const res = await fetch(`${API}/cart`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) return;
  const cart = await res.json() as { items?: Array<{ id: string }> };
  for (const item of cart.items ?? []) {
    await fetch(`${API}/cart/items/${item.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  }
}

export async function addToCartApi(
  token: string,
  productSlug: string,
): Promise<{ id: string }> {
  const product = await apiRequest<{ id: string }>('GET', `/products/slug/${productSlug}`);
  await apiRequest('POST', '/cart/items', { productId: product.id, quantity: 1 }, token);
  return product;
}

export async function verifyServerReachable(url: string, label: string): Promise<void> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok && res.status !== 401) {
      throw new Error(`${label} returned ${res.status}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`${label} unreachable at ${url}: ${msg}\n\nRun: pnpm dev`);
  }
}
