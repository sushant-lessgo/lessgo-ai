import { test, expect, type Page, type Dialog } from '@playwright/test';
import { AUDIENCES, seedDraft } from './helpers/seedDraft';

// Dirty-guard regression net for editor-shell-redesign phase 2.
//
// WHY THIS EXISTS: SaveStateChip.tsx registers a native `beforeunload`
// preventDefault (L58-78) whenever work isn't synced to the server, INCLUDING a
// `[contenteditable="true"][data-editing="true"]` mid-edit check. Scout §D: that
// guard is pure side-effect inside a component whose only other job is styling —
// deleting it during a reskin loses unsaved-work protection with NO type error
// and NO unit-test failure. This spec is the standing net so the reskin (and
// every later phase that re-mounts the chip) can't silently drop it.
//
// Shape mirrors e2e/edit-persistence.spec.ts (the precedent): authed Clerk
// session + self-skip guard → persona → /api/start → seedDraft (meridian, mock
// mode) → /edit/<token> → drive [data-element-key="headline"].
//
// TWO CHROMIUM FACTS this spec is built around — get these wrong and the spec
// silently proves nothing:
//   1. A plain goto()/navigation does NOT fire beforeunload from Playwright.
//      Only `page.close({ runBeforeUnload: true })` does.
//   2. beforeunload dialogs require STICKY USER ACTIVATION. A page that has
//      never been interacted with CANNOT show one — so a "no edits → no dialog"
//      assertion on a zero-interaction page passes even against a DELETED guard.
//      The negative case therefore performs a real, NON-DIRTYING click first, so
//      activation is present and the absence of a dialog is genuinely the
//      guard's decision. (Orchestrator amendment 1.)
test.describe.configure({ mode: 'serial' });

const HAS_AUTH_ENV = Boolean(
  process.env.E2E_CLERK_USER_EMAIL &&
    process.env.E2E_CLERK_USER_PASSWORD &&
    process.env.CLERK_SECRET_KEY,
);

// Meridian hero exposes a stable `headline` contenteditable. The guard is
// template-agnostic — one audience is enough.
const cfg = AUDIENCES.find((a) => a.templateId === 'meridian')!;

/** Create a throwaway project + seed a real mock-mode draft. Returns the token. */
async function seedProject(page: Page): Promise<string> {
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

  await seedDraft(api, token, cfg);
  return token;
}

/**
 * Arm a beforeunload-dialog recorder BEFORE the close that may trigger it.
 * Playwright auto-dismisses dialogs when no handler is attached, so the handler
 * must exist first or the event is unobservable.
 */
function armDialogRecorder(page: Page) {
  const seen: Dialog[] = [];
  let resolveFirst: (d: Dialog) => void;
  const first = new Promise<Dialog>((r) => { resolveFirst = r; });
  page.on('dialog', (d) => {
    seen.push(d);
    resolveFirst(d);
    // Dismiss = "stay on page" is irrelevant post-close; just don't hang.
    d.dismiss().catch(() => {});
  });

  /**
   * Await the dialog with a BOUNDED wait. Without this, a missing dialog fails as
   * a bare 3-minute suite timeout with no message — verified while proving this
   * spec can go red. A guard regression should read as "no beforeunload dialog",
   * in seconds, not as an unexplained timeout.
   */
  const expectDialog = async (why: string, timeout = 15_000): Promise<Dialog> => {
    const timedOut = Symbol('timeout');
    const race = await Promise.race([
      first,
      new Promise<typeof timedOut>((r) => setTimeout(() => r(timedOut), timeout)),
    ]);
    if (race === timedOut) throw new Error(`No beforeunload dialog fired within ${timeout}ms — ${why}`);
    return race as Dialog;
  };

  return { seen, first, expectDialog };
}

/** Open the seeded editor and wait for the hero headline to render. */
async function openEditor(page: Page, token: string) {
  await page.goto(`/edit/${token}`);
  const headline = page.locator('[data-element-key="headline"]').first();
  await expect(headline, 'hero headline never rendered in editor').toBeVisible({ timeout: 60_000 });
  return headline;
}

test('dirty-guard prompts on close while mid-edit (unsynced work is protected)', async ({ page }) => {
  test.skip(!HAS_AUTH_ENV, 'authed env (E2E_CLERK_* / CLERK_SECRET_KEY) not configured');

  const token = await seedProject(page);
  const headline = await openEditor(page, token);

  // Type WITHOUT blurring: the element stays [contenteditable="true"]
  // [data-editing="true"], so the guard's mid-edit branch fires deterministically
  // — no dependence on the autosave debounce flipping isDirty (which would race).
  await headline.click();
  await page.keyboard.press('End');
  await page.keyboard.type(`E2EGUARD${Date.now()}`, { delay: 30 });

  await expect(
    page.locator('[contenteditable="true"][data-editing="true"]'),
    'element never entered the mid-edit state the guard keys off',
  ).toHaveCount(1, { timeout: 15_000 });

  const { expectDialog } = armDialogRecorder(page);
  // close({ runBeforeUnload: true }) is the ONLY way to fire beforeunload here.
  // It does not wait for the page to close, so we await the dialog directly.
  await page.close({ runBeforeUnload: true });

  const dialog = await expectDialog('the SaveStateChip dirty-guard did not protect mid-edit work');
  expect(dialog.type(), 'expected a beforeunload dialog, got a different dialog type').toBe('beforeunload');
});

test('dirty-guard prompts on close inside the dirty window (post-blur, pre-autosave)', async ({ page }) => {
  test.skip(!HAS_AUTH_ENV, 'authed env (E2E_CLERK_* / CLERK_SECRET_KEY) not configured');

  const token = await seedProject(page);
  const headline = await openEditor(page, token);

  await headline.click();
  await page.keyboard.press('End');
  await page.keyboard.type(`E2EDIRTY${Date.now()}`, { delay: 30 });

  const { expectDialog } = armDialogRecorder(page);
  // Blur commits to the store → isDirty true → the autosave debounce starts. We
  // close inside that window, so the guard's deriveStatus() !== 'saved' branch
  // fires. This variant is timing-coupled by nature (the debounce could clear
  // isDirty first); if it turns flaky, downgrade it to fixme WITH THIS REASON —
  // do not delete it. The mid-edit test above is the mandatory one.
  await headline.evaluate((el: HTMLElement) => el.blur());
  await page.close({ runBeforeUnload: true });

  const dialog = await expectDialog('closed inside the dirty window but no prompt appeared');
  expect(dialog.type()).toBe('beforeunload');
});

test('dirty-guard stays SILENT on a clean page (with user activation present)', async ({ page }) => {
  test.skip(!HAS_AUTH_ENV, 'authed env (E2E_CLERK_* / CLERK_SECRET_KEY) not configured');

  const token = await seedProject(page);
  await openEditor(page, token);

  // Wait for the chip to actually read "Saved" — this is the precondition under
  // test (nothing owed, nothing in flight), not an assumption.
  const chip = page.locator('header [role="status"]').first();
  await expect(chip, 'save-state chip never settled on Saved').toHaveText(/Saved/i, { timeout: 30_000 });

  // ── The load-bearing line (amendment 1) ──────────────────────────────────
  // Give the page STICKY USER ACTIVATION via a real click on a neutral,
  // non-editable chrome region (the save-state chip itself: role="status", no
  // handler, cannot dirty the store). Without this click Chromium suppresses
  // beforeunload unconditionally and this test would pass against a DELETED
  // guard — proving nothing. With it, "no dialog" IS the guard's decision.
  await chip.click({ force: true });
  await expect(chip, 'the activation click dirtied the store — pick a different neutral target').toHaveText(
    /Saved/i,
  );

  const { seen } = armDialogRecorder(page);
  const closed = page.waitForEvent('close', { timeout: 15_000 });
  await page.close({ runBeforeUnload: true });

  // A clean page must close without a prompt.
  await closed;
  expect(seen.map((d) => d.type()), 'clean page must not prompt on close').toEqual([]);
});

test('review pill: visible while setup is incomplete, opens the review panel on click', async ({ page }) => {
  test.skip(!HAS_AUTH_ENV, 'authed env (E2E_CLERK_* / CLERK_SECRET_KEY) not configured');

  const token = await seedProject(page);
  await openEditor(page, token);

  // Name matcher is deliberately loose (/setup/i) so it holds across the phase-2
  // restyle: pre-restyle the accessible name is the "Setup: N left" text,
  // post-restyle it is the aria-label ("N setup steps left, click to open").
  const pill = page.locator('header').getByRole('button', { name: /setup/i }).first();

  // Asserted UNCONDITIONALLY, not behind an `if (allComplete) return` branch: a
  // freshly seeded meridian draft deterministically has open guide tasks (no
  // logo, stock hero image), so the pill MUST be here. An "if absent, skip"
  // branch would let a broken/deleted pill pass as the self-hide case — the same
  // vacuity trap as the dirty-guard negative. Verified empirically to hold.
  await expect(pill, 'review pill missing on a seeded draft with open setup steps').toBeVisible({
    timeout: 15_000,
  });
  await pill.click();
  // Clicking drives setLeftPanelTab('review') → the checklist renders.
  await expect(
    page.getByRole('button', { name: /Back to sections/i }),
    'review pill click did not open the review panel',
  ).toBeVisible({ timeout: 15_000 });
});
