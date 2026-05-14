/**
 * Global Teardown — Phase 5
 *
 * Runs once after all tests complete.
 * Removes users created by the test data factory so the DB doesn't
 * accumulate test-generated rows across CI runs.
 *
 * Only deletes rows matching the factory's email pattern — never touches
 * seeded accounts (admin@trustcart.co.ke, john.doe@example.com, etc.).
 */
import { Pool } from 'pg';

export default async function globalTeardown(): Promise<void> {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://trustcart:trustcart_local@localhost:5432/trustcart_dev',
    max: 2,
  });

  try {
    const result = await pool.query(
      `DELETE FROM users WHERE email LIKE '%@trustcart-e2e.test'`,
    );
    if ((result.rowCount ?? 0) > 0) {
      console.log(`\n🧹 Teardown: removed ${result.rowCount} factory-generated user(s)`);
    }
  } finally {
    await pool.end();
  }
}
