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
