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
      testMatch: [/generation\.spec\.ts/, /render\.spec\.ts/, /parity\.spec\.ts/, /workWave2\.spec\.ts/, /ui-isolation\.spec\.ts/, /forms-forgery\.spec\.ts/, /xfo-headers\.spec\.ts/],
      use: { ...devices['Desktop Chrome'] },
    },
    // Clerk sign-in → saves storageState.
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Authenticated flows (publish + throttled edit-persistence + the editor
    // dirty-guard + the dashboard suite). Serial, shared Clerk session from `setup`.
    //
    // NOTE: testMatch is an explicit ALLOWLIST — a spec only runs if it is listed
    // HERE. An unregistered spec silently matches no project and gives false
    // confidence: the suite goes green having never run it. (Both the editor-shell
    // and dashboard tracks hit this independently.) Add new authed specs here.
    // Listing a file before it exists is harmless — it simply matches nothing.
    {
      name: 'authed',
      testMatch: [
        /publish\.spec\.ts/,
        /edit-persistence\.spec\.ts/,
        /editor-dirty-guard\.spec\.ts/,
        /dashboard-shell\.spec\.ts/,
        /dashboard-workspace\.spec\.ts/,
        /dashboard-redirects\.spec\.ts/,
        /dashboard-lifecycle\.spec\.ts/,
        // account-settings: /dashboard/settings renders Clerk <UserProfile/>, not
        // the old persona selector (locks the "settings → persona selection" bug).
        /account-settings\.spec\.ts/,
        // blog-composer-redesign: manager = phase 1, composer = phase 2, ai-write = phase 4.
        // Pre-registered ahead of the files landing (harmless — an unmatched pattern is a
        // no-op) so no later phase rediscovers the false-confidence trap called out above.
        /blog-manager\.spec\.ts/,
        /blog-composer\.spec\.ts/,
        /blog-ai-write\.spec\.ts/,
        /dashboard-rollups-inbox\.spec\.ts/,
        // media-library-picker: media = phase 3, media-picker = phase 4 (pre-registered).
        /media\.spec\.ts/,
        /media-picker\.spec\.ts/,
        // work-onboarding-shell: the journey needs a Clerk session (seeded via
        // the real /api/start + /api/brief/confirm routes).
        /work-onboarding\.spec\.ts/,
        // engineDecider (phase 3): the WORK-lane entry D1→D2→D6→journey + the O1
        // one-liner-once regression. Authed (confirm + loadDraft need a session);
        // /api/v2/understand is route-intercepted (mock can't classify work).
        /engine-decider\.spec\.ts/,
        // work-onboarding-plan (E4): the plan-step tap-powers + approve→structure→fire
        // invariant (removed page absent from persisted Brief.structure AND no
        // generate-copy for the removed slug; kept pages still generated).
        /workPlan\.spec\.ts/,
        // work-onboarding-ingestion (E2): the binding/reveal proof on atelier2
        // (P1 authored it; P2's works flip makes the real post-flip path runnable).
        /work-binding\.spec\.ts/,
        // billing-beta: credit counter / gating / billing view — needs a Clerk session.
        /billing-beta\.spec\.ts/,
        // toolbar-standard-beta: seeded editor project + Clerk session.
        /toolbar-dispatch\.spec\.ts/,
        /link-picker\.spec\.ts/,
        /manage-items\.spec\.ts/,
        // toolbar-beta-followup: behavioral regen (element + section) through the shell.
        /toolbar-regen\.spec\.ts/,
        // work-library-board (phase 7): the "Your work" dashboard CorrectionBoard
        // CRUD round-trip — seeded atelier project + Clerk session.
        /work-library\.spec\.ts/,
        // editor-route-consolidation (phase 1): the inline Edit/Preview mode flip
        // — seeded editor project + Clerk session.
        /editor-preview-mode\.spec\.ts/,
        // editor-route-consolidation (phase 2): the chromeless /edit/[token]/preview
        // sub-route — seeded editor project + Clerk session.
        /editor-preview-route\.spec\.ts/,
        // cms-collections: authoring (phase 7) + publish round-trip (phases 3-4).
        // Both need a Clerk session (collection/item routes + /api/publish).
        // Registered late — until now they matched no project and never ran.
        /cms-authoring\.spec\.ts/,
        /cms-publish\.spec\.ts/,
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
      // `next dev` reads PORT. Without this, E2E_PORT only moved the probe/baseURL
      // while dev still grabbed 3000 (or the next free port — which, with sibling
      // worktrees running, is someone else's server) → webServer timeout, or worse,
      // reuseExistingServer:true silently tests a FOREIGN worktree's code.
      // With this, `E2E_PORT=<n>` alone is sufficient and self-consistent.
      PORT: String(PORT),
      // (B17: the work copy-engine env kill-switch `NEXT_PUBLIC_WORK_COPY_ENGINE`
      // was removed — work is always on via the allow-list. No env entry needed.)
    },
  },
});
