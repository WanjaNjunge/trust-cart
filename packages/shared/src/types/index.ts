/**
 * Shared TypeScript types
 */

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'CUSTOMER' | 'STAFF' | 'MANAGER' | 'ADMIN';

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// Additional types will be added as domains are implemented
