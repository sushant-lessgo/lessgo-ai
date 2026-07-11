import { test, expect } from '@playwright/test';
import { AUDIENCES, seedDraft } from './helpers/seedDraft';

// Throttled edit-persistence regression net (editor-trust-truth, law #5:
// "trust is tested"). Guards the silent-edit-loss bug class documented in
// reports/perf-editor-throttled6x-2026-07-11.md §Edit-loss: under CPU throttle a
// typed edit showed in the DOM but never reached the store, localStorage, or the
// server (0 saveDraft POSTs, lost on reload). perf-04 fixed the root cause; this
// spec is the standing net so it can't silently regress.
//
// Shape mirrors publish.spec: authed Clerk session (from the `setup` project's
// storageState) → persona → /api/start → seed a mock-mode Meridian draft via the
// real routes → open /edit/<token> → type under 6x CPU throttle → assert the edit
// reaches (1) the server (saveDraft POST carrying the marker) and (2) the
// localStorage draft, and (3) survives a reload.
test.describe.configure({ mode: 'serial' });

// Self-skip when the authed env isn't configured, so a targeted run degrades
// gracefully instead of a confusing failure (parity with the README's authed
// self-skip note). NOTE: the shared global.setup still requires these to mint the
// Clerk session for the whole authed project — this guard just makes intent clear.
const HAS_AUTH_ENV = Boolean(
  process.env.E2E_CLERK_USER_EMAIL &&
    process.env.E2E_CLERK_USER_PASSWORD &&
    process.env.CLERK_SECRET_KEY,
);

// One audience is enough — the commit/persist path is template-agnostic. Meridian
// hero exposes a stable `headline` contenteditable (data-element-key="headline").
const cfg = AUDIENCES.find((a) => a.templateId === 'meridian')!;

test('throttled edit persists to store, server + reload (no silent loss)', async ({ page }) => {
  test.skip(!HAS_AUTH_ENV, 'authed env (E2E_CLERK_* / CLERK_SECRET_KEY) not configured');

  // Unique marker so the assertions can't match pre-existing copy, and so the
  // saveDraft predicate can positively identify OUR edit's request body.
  const marker = `E2EPERSIST${Date.now()}`;

  // 1. Fresh authed session (refreshes Clerk's short-lived JWT — same rationale
  //    as publish.spec) and create a throwaway project.
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
  const api = page.request;

  const personaRes = await api.post('/api/user/persona', { data: { persona: cfg.persona } });
  expect(personaRes.ok(), `persona ${cfg.persona}: ${personaRes.status()}`).toBeTruthy();

  const startRes = await api.get('/api/start');
  expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
  const { url } = await startRes.json();
  const token = new URL(url).pathname.split('/').filter(Boolean).pop()!;
  expect(token, `bad token from ${url}`).toBeTruthy();

  // 2. Seed a real draft (strategy → copy → saveDraft, all mock mode).
  await seedDraft(api, token, cfg);

  // 3. Open the editor and wait for the hero headline to render. Throttle is
  //    applied AFTER load: dev-mode (unbundled) hydration at 6x is prohibitively
  //    slow/flaky, and the regression under test lives in the edit→commit path,
  //    not initial load. (Deviation from task step order — see audit.)
  await page.goto(`/edit/${token}`);
  const headline = page.locator('[data-element-key="headline"]').first();
  await expect(headline, 'hero headline never rendered in editor').toBeVisible({ timeout: 60_000 });

  // 4. 6x CPU throttle via CDP — approximates naayom-class low-end hardware where
  //    the commit-path starvation race originally surfaced.
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });

  // 5. Type the marker into the contenteditable, then blur.
  await headline.click();
  await page.keyboard.press('End');
  await page.keyboard.type(marker, { delay: 40 });
  // Sanity: the DOM shows the text (this always worked — the bug was that it
  // showed but never committed).
  await expect(headline).toContainText(marker, { timeout: 15_000 });

  // Arm the saveDraft listener BEFORE the blur that triggers the commit. The body
  // predicate guarantees it's THIS edit's autosave, not an unrelated write.
  const savePromise = page.waitForResponse(
    (r) =>
      r.url().includes('/api/saveDraft') &&
      r.request().method() === 'POST' &&
      (r.request().postData() || '').includes(marker),
    { timeout: 60_000 },
  );

  // Blur commits the edit (handleBlur → saveContent → store set → autosave arm).
  // Programmatic blur exercises the exact commit code path a click-away fires,
  // deterministically under throttle (a coordinate click on a "neutral gutter" is
  // viewport-fragile). See audit.
  await headline.evaluate((el: HTMLElement) => el.blur());

  // 6a. Server received it.
  const saveRes = await savePromise;
  expect(saveRes.status(), 'saveDraft did not return 200').toBe(200);

  // 6b. localStorage draft contains it (the store persisted the commit).
  await expect
    .poll(
      async () =>
        page.evaluate((t) => localStorage.getItem(`edit-store-${t}`) || '', token).then((d) => d.includes(marker)),
      { timeout: 15_000, message: 'marker never reached the localStorage edit-store draft' },
    )
    .toBe(true);

  // 7. Survives a reload (server/localStorage restore) — the user's edit is real.
  await page.reload();
  const headlineAfter = page.locator('[data-element-key="headline"]').first();
  await expect(headlineAfter, 'headline missing after reload').toBeVisible({ timeout: 60_000 });
  await expect(headlineAfter, 'edit lost after reload').toContainText(marker, { timeout: 15_000 });
});
