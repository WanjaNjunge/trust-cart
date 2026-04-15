// ===========================================
// TrustCart Kenya - Frontend Type Definitions
// ===========================================

// Product Types
export type ProductCondition =
  | 'BRAND_NEW'
  | 'OPEN_BOX'
  | 'CERTIFIED_REFURBISHED'
  | 'EX_UK'
  | 'EX_USA';

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  condition: ProductCondition;
  warrantyMonths: number;
  isActive: boolean;
  isFeatured: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  brand?: {
    id: string;
    name: string;
  };
  primaryImage?: {
    url: string;
    altText: string;
  };
  images?: ProductImage[];
  attributes?: ProductAttribute[];
  isInStock: boolean;
  availableQuantity?: number;
}

export interface ProductListResponse {
  data: Product[];
  pagination: Pagination;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  condition: ProductCondition;
  categoryId: string;
  brandId?: string;
  quantityOnHand?: number;
  images?: Array<{
    url: string;
    altText?: string;
    isPrimary?: boolean;
  }>;
  attributes?: Array<{
    name: string;
    value: string;
  }>;
  isActive?: boolean;
  isFeatured?: boolean;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  parentId?: string;
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
  children?: Category[];
  productCount: number;
}

export interface CategoryTreeResponse {
  data: Category[];
}

// Brand Types
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
  productCount: number;
}

export interface BrandListResponse {
  data: Brand[];
}

// Common Types
export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// Query Parameters
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  brandId?: string;
  condition?: ProductCondition;
  priceMin?: number;
  priceMax?: number;
  q?: string;
  sort?: string;
  isFeatured?: boolean;
}

// ===========================================
// Auth Types
// ===========================================

export type UserRole = 'CUSTOMER' | 'STAFF' | 'MANAGER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  emailVerified?: boolean;
  createdAt?: string;
}

export interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  county: string;
  isDefault: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateAddressRequest {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  county: string;
  isDefault?: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

// ===========================================
// Cart Types
// ===========================================

export interface CartItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    primaryImage?: {
      url: string;
      altText: string;
    };
  };
  quantity: number;
  priceAtAdd: number;
  lineTotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  promoCode?: {
    code: string;
    discountType: string;
    discountValue: number;
  };
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
  expiresAt?: string;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

// ===========================================
// Order Types
// ===========================================

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod = 'MPESA_STK' | 'MPESA_PAYBILL' | 'CARD' | 'POD_CASH';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderAddress {
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  county: string;
}

export interface OrderStatusHistory {
  fromStatus?: string;
  toStatus: string;
  changedByType: string;
  reason?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  address: OrderAddress | null;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  promoCode?: string;
  statusHistory: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutRequest {
  addressId: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface CheckoutResponse {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  paymentMethod: string;
  message: string;
}

export interface OrderListResponse {
  data: Order[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
