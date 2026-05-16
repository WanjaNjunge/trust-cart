import type {
  Product,
  ProductListResponse,
  ProductQueryParams,
  Category,
  CategoryTreeResponse,
  Brand,
  BrandListResponse,
  User,
  Address,
  LoginResponse,
  RegisterRequest,
  LoginRequest,
  CreateAddressRequest,
  UpdateProfileRequest,
  Cart,
  CartItem,
  AddToCartRequest,
} from './types';

// ===========================================
// API Client Configuration
// ===========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public error?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.message || 'An error occurred', errorData.error);
  }

  return response.json();
}

// ===========================================
// Products API
// ===========================================

export async function getProducts(params?: ProductQueryParams): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });
  }

  const queryString = searchParams.toString();
  const endpoint = `/products${queryString ? `?${queryString}` : ''}`;

  return fetchApi<ProductListResponse>(endpoint);
}

export async function getProductBySlug(slug: string): Promise<Product> {
  return fetchApi<Product>(`/products/slug/${slug}`);
}

export async function getProductById(id: string): Promise<Product> {
  return fetchApi<Product>(`/products/${id}`);
}

export async function getFeaturedProducts(limit = 10): Promise<ProductListResponse> {
  return getProducts({ isFeatured: true, limit });
}

// ===========================================
// Categories API
// ===========================================

export async function getCategories(): Promise<CategoryTreeResponse> {
  return fetchApi<CategoryTreeResponse>('/categories');
}

export async function getCategoryBySlug(slug: string): Promise<Category> {
  return fetchApi<Category>(`/categories/${slug}`);
}

// ===========================================
// Brands API
// ===========================================

export async function getBrands(): Promise<BrandListResponse> {
  return fetchApi<BrandListResponse>('/brands');
}

export async function getBrandBySlug(slug: string): Promise<Brand> {
  return fetchApi<Brand>(`/brands/${slug}`);
}

// ===========================================
// Search API
// ===========================================

export async function searchProducts(query: string, limit = 20): Promise<ProductListResponse> {
  return getProducts({ q: query, limit });
}

// ===========================================
// Auth API
// ===========================================

// Token is now an HttpOnly cookie — no import from auth needed for the credential.
// credentials: 'include' instructs the browser to send the cookie automatically.

export async function authenticatedFetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends HttpOnly access_token cookie (FIND-016)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.message || 'An error occurred', errorData.error);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const authenticatedRequest = authenticatedFetchApi;

export async function register(data: RegisterRequest): Promise<User> {
  return fetchApi<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return fetchApi<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return fetchApi<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  return fetchApi<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

export async function getPaymentStatus(
  transactionId: string,
): Promise<{ id: string; status: string; orderId: string; amount: number; method: string; createdAt: string }> {
  return authenticatedFetchApi(`/payments/${transactionId}`);
}

// ===========================================
// User Profile API
// ===========================================

export async function getProfile(): Promise<User> {
  return authenticatedFetchApi<User>('/users/me');
}

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  return authenticatedFetchApi<User>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ===========================================
// User Addresses API
// ===========================================

export async function getAddresses(): Promise<Address[]> {
  return authenticatedFetchApi<Address[]>('/users/me/addresses');
}

export async function createAddress(data: CreateAddressRequest): Promise<Address> {
  return authenticatedFetchApi<Address>('/users/me/addresses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAddress(
  id: string,
  data: Partial<CreateAddressRequest>,
): Promise<Address> {
  return authenticatedFetchApi<Address>(`/users/me/addresses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAddress(id: string): Promise<{ message: string }> {
  return authenticatedFetchApi<{ message: string }>(`/users/me/addresses/${id}`, {
    method: 'DELETE',
  });
}

export async function setDefaultAddress(id: string): Promise<Address> {
  return authenticatedFetchApi<Address>(`/users/me/addresses/${id}/default`, {
    method: 'POST',
  });
}

// ===========================================
// Cart API
// ===========================================

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem('cart_session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('cart_session', sessionId);
  }
  return sessionId;
}

async function cartFetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const sessionId = getSessionId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Session-ID': sessionId,
    ...(options?.headers as Record<string, string>),
  };

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends HttpOnly access_token cookie for logged-in users (FIND-016)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.message || 'An error occurred', errorData.error);
  }

  return response.json();
}

export async function getCart(): Promise<Cart> {
  return cartFetchApi<Cart>('/cart');
}

export async function addToCart(data: AddToCartRequest): Promise<Cart> {
  return cartFetchApi<Cart>('/cart/items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  return cartFetchApi<Cart>(`/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  return cartFetchApi<Cart>(`/cart/items/${itemId}`, {
    method: 'DELETE',
  });
}

export async function applyCartPromoCode(code: string): Promise<Cart> {
  return cartFetchApi<Cart>('/cart/promo', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function removeCartPromoCode(): Promise<Cart> {
  return cartFetchApi<Cart>('/cart/promo', {
    method: 'DELETE',
  });
}

// ===========================================
// Checkout & Orders API
// ===========================================

import type {
  CheckoutRequest,
  CheckoutResponse,
  Order,
  OrderItem,
  OrderListResponse,
} from './types';

export async function checkout(data: CheckoutRequest): Promise<CheckoutResponse> {
  return cartFetchApi<CheckoutResponse>('/checkout', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}


export async function initiatePayment(orderId: string, phoneNumber?: string): Promise<{ status: string; message: string; transactionId: string }> {
  return cartFetchApi<{ status: string; message: string; transactionId: string }>('/payments/initiate', {
    method: 'POST',
    body: JSON.stringify({ orderId, phoneNumber }),
  });
}

export async function getOrders(page = 1, limit = 10): Promise<OrderListResponse> {
  return authenticatedFetchApi<OrderListResponse>(`/orders?page=${page}&limit=${limit}`);
}

export async function getOrderById(id: string): Promise<Order> {
  return authenticatedFetchApi<Order>(`/orders/${id}`);
}

export async function cancelOrder(id: string, reason?: string): Promise<Order> {
  return authenticatedFetchApi<Order>(`/orders/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// Re-export types for convenience
export type {
  Product,
  Category,
  Brand,
  ProductListResponse,
  ProductQueryParams,
  User,
  Address,
  Cart,
  CartItem,
  Order,
  OrderItem,
  CheckoutRequest,
  CheckoutResponse,
  OrderListResponse,
};
