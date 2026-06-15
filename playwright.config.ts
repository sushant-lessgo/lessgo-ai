import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';

// Load .env.local so globalSetup / auth.setup (Node side) get CLERK_SECRET_KEY +
// publishable key + E2E test creds. next dev loads its own copy for the server.
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// E2E for the template release.
//  - PUBLIC specs (generation, render) run without auth in mock mode.
//  - AUTHED spec (publish) reuses a Clerk session saved by the `setup` project.
//
// Run:  npx playwright install chromium   (first time)
//       npm run test:e2e
const PORT = Number(process.env.E2E_PORT ?? 3000);
const AUTH_FILE = 'e2e/.clerk/user.json';

export default defineConfig({
  testDir: './e2e',
  // Serial: all specs share one dev server with in-memory AI/draft rate limiters;
  // parallel workers burst the generation routes past the limit (429). The suite
  // is small, so serial is both reliable and fast enough.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  // Generous: the publish flow is slow in local dev because Vercel Blob/KV calls
  // (absent locally) run to their timeouts/retries before the non-fatal fallback.
  timeout: 180_000,
  globalSetup: './e2e/global.setup.ts',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    // Public, no-auth smokes.
    {
      name: 'public',
      testMatch: [/generation\.spec\.ts/, /render\.spec\.ts/],
      use: { ...devices['Desktop Chrome'] },
    },
    // Clerk sign-in → saves storageState.
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Authenticated publish flow.
    {
      name: 'authed',
      testMatch: /publish\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // Mock mode: bypasses Clerk auth on generation routes AND returns canned
      // copy (no credits, deterministic). Override per-run with E2E_LLM=real.
      NEXT_PUBLIC_USE_MOCK_GPT: process.env.E2E_LLM === 'real' ? 'false' : 'true',
    },
  },
});
