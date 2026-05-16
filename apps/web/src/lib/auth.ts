// ===========================================
// Auth State Management (FIND-016)
//
// JWT is now stored in an HttpOnly cookie set by the server.
// JavaScript cannot read the cookie — it is sent automatically
// by the browser on every credentialed request.
//
// This file manages the non-sensitive user profile data in
// localStorage (id, email, name, role — needed for UI rendering).
// The actual auth credential (JWT) never touches JS memory.
// ===========================================

const USER_KEY = 'trustcart_user';

// getToken / setToken removed — token is in HttpOnly cookie, not accessible to JS.

/** True when user data exists in localStorage (set after successful login). */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(USER_KEY);
}

/**
 * Clear local user data from localStorage.
 * The actual JWT cookie is cleared server-side via POST /auth/logout.
 */
export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
}

// getToken kept as a no-op shim so any remaining call sites compile without error.
// It always returns null — the real token travels as an HttpOnly cookie.
/** @deprecated Token is now in HttpOnly cookie. Always returns null. */
export function getToken(): string | null {
  return null;
}

/** @deprecated Token is set by the server via Set-Cookie. This is a no-op. */
export function setToken(_token: string): void {
  // intentional no-op — server owns the cookie
}

export function getStoredUser(): import('./types').User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as import('./types').User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: import('./types').User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function hasRole(user: import('./types').User | null, allowedRoles: string[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

export function isAdminOrStaff(user: import('./types').User | null): boolean {
  return hasRole(user, ['ADMIN', 'MANAGER', 'STAFF']);
}
