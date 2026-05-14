/**
 * Test Data Factory — Phase 5
 *
 * Creates unique, isolated test data per test run.
 *
 * WHY: The current suite hardcodes john.doe@example.com across all tests.
 * One shared user means tests can corrupt each other's state (cart, orders).
 * The factory generates a fresh user per test with a collision-proof email,
 * so tests are truly independent and can run in parallel if workers > 1.
 *
 * The email pattern `*@trustcart-e2e.test` is matched by the global teardown,
 * which prunes these users after every full test run.
 */
import { apiRequest } from '../helpers/api';
import { loginViaApi } from '../helpers/auth';

export interface FactoryUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  token: string;
  userId: string;
}

/**
 * Registers a new customer and returns their credentials + fresh JWT.
 *
 * Email format: test.customer+<timestamp>-<random>@trustcart-e2e.test
 * This guarantees uniqueness across workers and test runs.
 *
 * Cleanup: handled by global-teardown.ts which DELETE WHERE email LIKE
 * '%@trustcart-e2e.test' after all tests complete.
 */
export async function createTestCustomer(): Promise<FactoryUser> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const email = `test.customer+${suffix}@trustcart-e2e.test`;
  const password = 'TestFactory1!';
  const firstName = 'Test';
  const lastName = `E2E-${suffix.slice(-5)}`;

  await apiRequest('POST', '/auth/register', {
    email,
    firstName,
    lastName,
    password,
  });

  const auth = await loginViaApi(email, password);

  return {
    email,
    password,
    firstName,
    lastName,
    token: auth.token,
    userId: auth.user.id,
  };
}
