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
      testMatch: [/generation\.spec\.ts/, /render\.spec\.ts/, /parity\.spec\.ts/, /ui-isolation\.spec\.ts/],
      use: { ...devices['Desktop Chrome'] },
    },
    // Clerk sign-in → saves storageState.
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Authenticated flows (publish + throttled edit-persistence + the dashboard
    // suite). Serial, shared Clerk session from `setup`.
    //
    // NOTE: a spec only runs if it is listed HERE — an unregistered spec silently
    // matches no project and gives false confidence. The dashboard-workspace-ia
    // specs are pre-registered across all its phases (shell = phases 1-2,
    // workspace = phase 3, redirects = phases 4-5); listing a file before it
    // exists is harmless (it simply matches nothing).
    {
      name: 'authed',
      testMatch: [
        /publish\.spec\.ts/,
        /edit-persistence\.spec\.ts/,
        /dashboard-shell\.spec\.ts/,
        /dashboard-workspace\.spec\.ts/,
        /dashboard-redirects\.spec\.ts/,
        // work-onboarding-shell: the journey needs a Clerk session (seeded via
        // the real /api/start + /api/brief/confirm routes).
        /work-onboarding\.spec\.ts/,
      ],
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
      // work-onboarding-shell: the work copy-engine kill-switch. Off ⇒ STEP 05
      // hard-fails by design (landmine 2), so the journey e2e needs it ON.
      //
      // ⚠️ NEXT_PUBLIC_* is BUILD-TIME INLINED and `reuseExistingServer: !CI`
      // means a dev server already listening on the port is reused AS-IS — it
      // will not have this var. Kill stale dev servers before running the suite.
      NEXT_PUBLIC_WORK_COPY_ENGINE: 'true',
    },
  },
});
