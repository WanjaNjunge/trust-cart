// Seeded test accounts — password is Test123! for all
export const USERS = {
  admin: { email: 'admin@trustcart.co.ke', password: 'Test123!', role: 'ADMIN' },
  manager: { email: 'manager@trustcart.co.ke', password: 'Test123!', role: 'MANAGER' },
  staff: { email: 'staff@trustcart.co.ke', password: 'Test123!', role: 'STAFF' },
  customer: { email: 'john.doe@example.com', password: 'Test123!', role: 'CUSTOMER' },
  customer2: { email: 'jane.wanjiku@example.com', password: 'Test123!', role: 'CUSTOMER' },
} as const;

// Known slugs from seed data
export const SLUGS = {
  product: 'hp-elitebook-840-g6',
  product2: 'lenovo-thinkpad-t480',
  category: 'laptops',
} as const;

export const PROMO_CODES = {
  percent: 'WELCOME10', // 10% off
} as const;
