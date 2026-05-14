/**
 * Global Setup — runs once before the entire test suite.
 * Verifies both servers are reachable, resets the database to a clean
 * known state via seed, then confirms the API recovered before tests begin.
 * If any step fails, the suite aborts with a descriptive error.
 */


import { execSync } from 'child_process';
import { verifyServerReachable } from './helpers/api';

async function waitForServer(url: string, label: string, maxWaitMs = 60_000): Promise<void> {
  const interval = 3_000;
  const deadline = Date.now() + maxWaitMs;
  let lastErr = '';
  process.stdout.write(`  Waiting for ${label}...`);
  while (Date.now() < deadline) {
    try {
      await verifyServerReachable(url, label);
      process.stdout.write(' ready\n');
      return;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      process.stdout.write('.');
      await new Promise((r) => setTimeout(r, interval));
    }
  }
  process.stdout.write('\n');
  throw new Error(`${label} did not become ready within ${maxWaitMs / 1000}s: ${lastErr}`);
}

export default async function globalSetup() {
  console.log('\n🔍 Verifying servers are running...');

  await waitForServer('http://localhost:3001/api/v1/products', 'API (port 3001)');
  console.log('  ✓ API reachable');

  await waitForServer('http://localhost:3000', 'Web app (port 3000)');
  console.log('  ✓ Web app reachable');

  // Reset database to a known clean state before every test run.
  // This resets quantityOnHand=20 and quantityReserved=0 for all products,
  // preventing INSUFFICIENT_STOCK failures caused by confirmed orders from
  // previous runs depleting inventory.
  console.log('  Seeding database...');
  execSync('pnpm db:seed', { cwd: process.cwd(), stdio: 'pipe' });
  console.log('  ✓ Database seeded — inventory reset');

  // Re-verify the API is still responsive after the seed's DB operations complete.
  // The seed briefly saturates the PostgreSQL connection pool; without this check
  // the first few tests can hit ECONNREFUSED while the server recovers.
  await waitForServer('http://localhost:3001/api/v1/products', 'API post-seed');
  console.log('  ✓ API healthy after seed\n');
}
