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

  // Verify seed data exists by checking a known product slug
  const res = await fetch('http://localhost:3001/api/v1/products/slug/hp-elitebook-840-g6');
  if (!res.ok) {
    throw new Error(
      'Seed data missing. Run: pnpm db:seed\n' +
        'Expected product slug "hp-elitebook-840-g6" not found.',
    );
  }
  console.log('  ✓ Seed data verified\n');
}
