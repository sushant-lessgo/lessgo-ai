import { clerkSetup } from '@clerk/testing/playwright';
import { createClerkClient } from '@clerk/backend';

// Runs once before all projects. (1) mints the Clerk Testing Token (bypasses bot
// protection), (2) idempotently ensures the E2E test user exists so password
// sign-in + the app's User upsert have something to bind to.
async function globalSetup() {
  await clerkSetup();

  const email = process.env.E2E_CLERK_USER_EMAIL;
  const password = process.env.E2E_CLERK_USER_PASSWORD;
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!email || !password || !secretKey) {
    throw new Error(
      'E2E auth needs E2E_CLERK_USER_EMAIL, E2E_CLERK_USER_PASSWORD, CLERK_SECRET_KEY in .env.local',
    );
  }

  const clerk = createClerkClient({ secretKey });
  const { data: existing } = await clerk.users.getUserList({ emailAddress: [email] });
  if (existing.length === 0) {
    await clerk.users.createUser({
      emailAddress: [email],
      password,
      skipPasswordChecks: true,
    });
    // eslint-disable-next-line no-console
    console.log(`[e2e] created test user ${email}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[e2e] test user ${email} already exists`);
  }
}

export default globalSetup;
